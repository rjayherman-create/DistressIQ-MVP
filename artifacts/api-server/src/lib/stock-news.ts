import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StockNewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  summary?: string;
  publishedAt: string;
  imageUrl?: string;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const NEWS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface NewsEntry {
  items: StockNewsItem[];
  fetchedAt: number;
}

const newsCache = new Map<string, NewsEntry>();

// ---------------------------------------------------------------------------
// Polygon.io news
// ---------------------------------------------------------------------------

interface PolygonNewsResult {
  id: string;
  title?: string;
  article_url?: string;
  published_utc?: string;
  description?: string;
  image_url?: string;
  publisher?: {
    name?: string;
    favicon_url?: string;
  };
}

async function fetchPolygonNews(
  ticker: string,
  limit: number,
): Promise<StockNewsItem[]> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    throw new Error("POLYGON_API_KEY not set");
  }

  const url =
    `https://api.polygon.io/v2/reference/news` +
    `?ticker=${encodeURIComponent(ticker)}&limit=${limit}&sort=published_utc&order=desc` +
    `&apiKey=${apiKey}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });

  if (!res.ok) {
    throw new Error(`Polygon news HTTP ${res.status} ${res.statusText} for ${ticker}`);
  }

  const json = (await res.json()) as {
    results?: PolygonNewsResult[];
    status?: string;
  };

  const results = json?.results ?? [];
  return results
    .filter((r) => r.title && r.article_url && r.published_utc)
    .map((r) => ({
      id: r.id,
      title: r.title!,
      url: r.article_url!,
      source: r.publisher?.name ?? "Unknown",
      summary: r.description,
      publishedAt: r.published_utc!,
      imageUrl: r.image_url,
    }));
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Yahoo Finance RSS fallback
// ---------------------------------------------------------------------------

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

// Pre-compiled regexes used in RSS item parsing.
const RSS_ITEM_REGEX = /<item>([\s\S]*?)<\/item>/gi;
const CDATA_REGEX = /^<!\[CDATA\[|\]\]>$/g;
const HTML_TAG_REGEX = /<[^>]+>/g;
const WHITESPACE_REGEX = /\s+/g;

function makeTagRegex(tag: string): [RegExp, RegExp] {
  return [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  ];
}

// Cache compiled tag regexes to avoid rebuilding them for each RSS item.
const tagRegexCache = new Map<string, [RegExp, RegExp]>();

function parseRssItem(
  item: string,
  ticker: string,
  idxCounter: number,
): StockNewsItem | null {
  const getTag = (tag: string): string | undefined => {
    let regexPair = tagRegexCache.get(tag);
    if (!regexPair) {
      regexPair = makeTagRegex(tag);
      tagRegexCache.set(tag, regexPair);
    }
    const [cdataRe, plainRe] = regexPair;
    const m = item.match(cdataRe) ?? item.match(plainRe);
    return m ? m[1].trim() : undefined;
  };

  const title = getTag("title");
  const link = getTag("link") ?? getTag("guid");
  const pubDate = getTag("pubDate");
  const description = getTag("description");

  if (!title || !link || !pubDate) return null;

  let publishedAt: string;
  try {
    publishedAt = new Date(pubDate).toISOString();
  } catch {
    return null;
  }

  // Extract a clean URL from link (strip CDATA / whitespace)
  const cleanLink = link.replace(CDATA_REGEX, "").trim();
  if (!cleanLink.startsWith("http")) return null;

  // Strip HTML tags from description
  const cleanSummary = description
    ? description.replace(HTML_TAG_REGEX, " ").replace(WHITESPACE_REGEX, " ").trim()
    : undefined;

  // Use ticker + link hash for a stable, unique ID across fetches.
  const linkHash = cleanLink.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 0);
  const id = `yahoo-rss-${ticker.toUpperCase()}-${linkHash}-${idxCounter}`;

  return {
    id,
    title,
    url: cleanLink,
    source: "Yahoo Finance",
    summary: cleanSummary,
    publishedAt,
  };
}

async function fetchYahooRssNews(
  ticker: string,
  limit: number,
): Promise<StockNewsItem[]> {
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(ticker)}&region=US&lang=en-US`;

  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(6_000),
  });

  if (!res.ok) {
    throw new Error(`Yahoo RSS HTTP ${res.status} ${res.statusText} for ${ticker}`);
  }

  const text = await res.text();

  // Extract <item>...</item> blocks using the pre-compiled regex.
  // Reset lastIndex before each use since it's a stateful global regex.
  RSS_ITEM_REGEX.lastIndex = 0;
  const itemBlocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = RSS_ITEM_REGEX.exec(text)) !== null) {
    itemBlocks.push(match[1]);
  }

  const items: StockNewsItem[] = [];
  for (let i = 0; i < itemBlocks.length && items.length < limit; i++) {
    const parsed = parseRssItem(itemBlocks[i], ticker, i);
    if (parsed) items.push(parsed);
  }

  return items;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch live news for a ticker.
 *
 * Priority:
 *  1. Polygon.io reference news (when POLYGON_API_KEY is set)
 *  2. Yahoo Finance RSS feed (no API key required)
 *
 * Results are cached for 5 minutes per ticker.
 */
export async function fetchStockNews(
  ticker: string,
  limit = 10,
): Promise<StockNewsItem[]> {
  const cacheKey = `${ticker.toUpperCase()}:${limit}`;
  const now = Date.now();
  const cached = newsCache.get(cacheKey);
  if (cached && now - cached.fetchedAt < NEWS_CACHE_TTL_MS) {
    return cached.items;
  }

  let items: StockNewsItem[] = [];

  // --- Polygon ---
  if (process.env.POLYGON_API_KEY) {
    try {
      items = await fetchPolygonNews(ticker, limit);
      logger.debug({ ticker, count: items.length }, "Polygon news ok");
    } catch (err) {
      logger.warn({ err, ticker }, "Polygon news failed — falling back to Yahoo RSS");
    }
  }

  // --- Yahoo RSS fallback ---
  if (items.length === 0) {
    try {
      items = await fetchYahooRssNews(ticker, limit);
      logger.debug({ ticker, count: items.length }, "Yahoo RSS news ok");
    } catch (err) {
      logger.warn({ err, ticker }, "Yahoo RSS news failed");
    }
  }

  newsCache.set(cacheKey, { items, fetchedAt: now });
  return items;
}

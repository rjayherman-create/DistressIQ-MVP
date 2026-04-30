import { Router, type IRouter } from "express";
import {
  ListStocksResponse,
  GetStockResponse,
  GetStockNewsResponse,
} from "@workspace/api-zod";
import { fetchQuotes, fetchWeeklyHistory } from "../lib/yahoo-finance";
import { fetchPolygonBatch, fetchAlphaVantage, type RawMarketData } from "../lib/market-data";
import { fetchStockNews } from "../lib/stock-news";
import { computeAdjustedScores } from "../lib/score-engine";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Static definitions — scores, notes, and trade plan zones are analyst-assigned.
// Price, volume, and chart are overlaid with live data at request time.
// Scores are further refined at query time by the score engine using live prices.
const stockDefinitions = [
  {
    ticker: "TELA",
    company: "TELA Bio",
    price: 0.83,
    exchange: "NASDAQ",
    industry: "MedTech",
    daysUnderOne: 47,
    daysToDeadline: 174,
    bounceProbability: 68,
    delistingRisk: 34,
    complianceScore: 74,
    financialScore: 41,
    operatorScore: 58,
    industryScore: 49,
    patternScore: 66,
    tradabilityScore: 72,
    operatorNote: "Mixed management record; not a serial destroyer.",
    financialNote: "Weak profitability, but capital markets access still open.",
    tradeWindow: "7–21 days",
    entryZone: "$0.78–$0.82",
    targetZone: "$0.96–$1.06",
    stopZone: "$0.72",
    status: "Recovery Candidate",
    volume: "133.6K",
    chart: [
      { d: "W1", p: 1.34 },
      { d: "W2", p: 1.12 },
      { d: "W3", p: 0.98 },
      { d: "W4", p: 0.88 },
      { d: "W5", p: 0.84 },
      { d: "W6", p: 0.79 },
      { d: "W7", p: 0.76 },
      { d: "W8", p: 0.83 },
    ],
  },
  {
    ticker: "GAME",
    company: "GameSquare",
    price: 0.29,
    exchange: "NASDAQ",
    industry: "Media / Esports",
    daysUnderOne: 212,
    daysToDeadline: 167,
    bounceProbability: 39,
    delistingRisk: 77,
    complianceScore: 31,
    financialScore: 26,
    operatorScore: 43,
    industryScore: 45,
    patternScore: 34,
    tradabilityScore: 48,
    operatorNote: "Late-stage compliance case with extension already used.",
    financialNote: "Heavily dependent on capital markets support.",
    tradeWindow: "3–10 days",
    entryZone: "$0.26–$0.28",
    targetZone: "$0.34–$0.40",
    stopZone: "$0.23",
    status: "High Delisting Risk",
    volume: "589K",
    chart: [
      { d: "W1", p: 0.74 },
      { d: "W2", p: 0.61 },
      { d: "W3", p: 0.52 },
      { d: "W4", p: 0.43 },
      { d: "W5", p: 0.38 },
      { d: "W6", p: 0.33 },
      { d: "W7", p: 0.27 },
      { d: "W8", p: 0.29 },
    ],
  },
  {
    ticker: "FFIE",
    company: "Faraday Future Intelligent Electric",
    price: 0.35,
    exchange: "NASDAQ",
    industry: "EV",
    daysUnderOne: 58,
    daysToDeadline: 176,
    bounceProbability: 54,
    delistingRisk: 62,
    complianceScore: 60,
    financialScore: 18,
    operatorScore: 35,
    industryScore: 24,
    patternScore: 59,
    tradabilityScore: 67,
    operatorNote: "Speculative operator profile with higher pattern risk.",
    financialNote:
      "Very weak business quality; movement is mostly capital-market driven.",
    tradeWindow: "2–8 days",
    entryZone: "$0.31–$0.34",
    targetZone: "$0.42–$0.50",
    stopZone: "$0.28",
    status: "Management Action Likely",
    volume: "235.1M",
    chart: [
      { d: "W1", p: 1.11 },
      { d: "W2", p: 0.92 },
      { d: "W3", p: 0.76 },
      { d: "W4", p: 0.63 },
      { d: "W5", p: 0.49 },
      { d: "W6", p: 0.37 },
      { d: "W7", p: 0.29 },
      { d: "W8", p: 0.35 },
    ],
  },
  {
    ticker: "ALXO",
    company: "ALX Oncology",
    price: 0.96,
    exchange: "NASDAQ",
    industry: "Biotech",
    daysUnderOne: 29,
    daysToDeadline: 205,
    bounceProbability: 71,
    delistingRisk: 28,
    complianceScore: 82,
    financialScore: 44,
    operatorScore: 61,
    industryScore: 22,
    patternScore: 70,
    tradabilityScore: 75,
    operatorNote:
      "Cleaner than average setup, but biotech remains structurally risky.",
    financialNote:
      "Cash exists, but survival still relies on pipeline outcomes.",
    tradeWindow: "5–15 days",
    entryZone: "$0.92–$0.95",
    targetZone: "$1.05–$1.15",
    stopZone: "$0.88",
    status: "Recovery Candidate",
    volume: "1.8M",
    chart: [
      { d: "W1", p: 1.48 },
      { d: "W2", p: 1.27 },
      { d: "W3", p: 1.14 },
      { d: "W4", p: 1.03 },
      { d: "W5", p: 0.98 },
      { d: "W6", p: 0.94 },
      { d: "W7", p: 0.93 },
      { d: "W8", p: 0.96 },
    ],
  },
  {
    ticker: "MULN",
    company: "Mullen Automotive",
    price: 0.09,
    exchange: "NASDAQ",
    industry: "EV Trucks",
    daysUnderOne: 341,
    daysToDeadline: 14,
    bounceProbability: 22,
    delistingRisk: 94,
    complianceScore: 12,
    financialScore: 8,
    operatorScore: 19,
    industryScore: 31,
    patternScore: 28,
    tradabilityScore: 62,
    operatorNote: "Serial diluter; reverse splits have failed to sustain compliance.",
    financialNote: "Near-zero revenue, deep cash burn, and ongoing equity raises.",
    tradeWindow: "1–4 days",
    entryZone: "$0.08–$0.09",
    targetZone: "$0.12–$0.16",
    stopZone: "$0.07",
    status: "High Delisting Risk",
    volume: "12.4M",
    chart: [
      { d: "W1", p: 0.41 },
      { d: "W2", p: 0.29 },
      { d: "W3", p: 0.21 },
      { d: "W4", p: 0.16 },
      { d: "W5", p: 0.13 },
      { d: "W6", p: 0.10 },
      { d: "W7", p: 0.08 },
      { d: "W8", p: 0.09 },
    ],
  },
  {
    ticker: "NKLA",
    company: "Nikola Corporation",
    price: 0.44,
    exchange: "NASDAQ",
    industry: "Hydrogen Trucks",
    daysUnderOne: 124,
    daysToDeadline: 56,
    bounceProbability: 34,
    delistingRisk: 81,
    complianceScore: 27,
    financialScore: 14,
    operatorScore: 31,
    industryScore: 38,
    patternScore: 41,
    tradabilityScore: 71,
    operatorNote: "New management post-founder conviction; credibility rebuilding is slow.",
    financialNote: "Restructuring underway but cash runway is critically short.",
    tradeWindow: "2–7 days",
    entryZone: "$0.39–$0.43",
    targetZone: "$0.54–$0.64",
    stopZone: "$0.35",
    status: "High Delisting Risk",
    volume: "8.7M",
    chart: [
      { d: "W1", p: 1.18 },
      { d: "W2", p: 0.97 },
      { d: "W3", p: 0.82 },
      { d: "W4", p: 0.67 },
      { d: "W5", p: 0.56 },
      { d: "W6", p: 0.47 },
      { d: "W7", p: 0.40 },
      { d: "W8", p: 0.44 },
    ],
  },
  {
    ticker: "GOEV",
    company: "Canoo Inc",
    price: 0.21,
    exchange: "NASDAQ",
    industry: "EV Vans",
    daysUnderOne: 287,
    daysToDeadline: 22,
    bounceProbability: 19,
    delistingRisk: 92,
    complianceScore: 16,
    financialScore: 11,
    operatorScore: 24,
    industryScore: 36,
    patternScore: 22,
    tradabilityScore: 58,
    operatorNote: "Funding uncertainty has stalled production at near-zero volumes.",
    financialNote: "Minimal revenue against heavy operating losses; survival depends on new capital.",
    tradeWindow: "1–4 days",
    entryZone: "$0.18–$0.20",
    targetZone: "$0.27–$0.33",
    stopZone: "$0.15",
    status: "High Delisting Risk",
    volume: "3.1M",
    chart: [
      { d: "W1", p: 0.78 },
      { d: "W2", p: 0.58 },
      { d: "W3", p: 0.44 },
      { d: "W4", p: 0.33 },
      { d: "W5", p: 0.27 },
      { d: "W6", p: 0.23 },
      { d: "W7", p: 0.19 },
      { d: "W8", p: 0.21 },
    ],
  },
  {
    ticker: "IDEX",
    company: "Ideanomics Inc",
    price: 0.28,
    exchange: "NASDAQ",
    industry: "EV Fintech",
    daysUnderOne: 198,
    daysToDeadline: 44,
    bounceProbability: 31,
    delistingRisk: 86,
    complianceScore: 22,
    financialScore: 17,
    operatorScore: 29,
    industryScore: 42,
    patternScore: 35,
    tradabilityScore: 55,
    operatorNote: "Repeated compliance failures; management has limited credibility.",
    financialNote: "Thin revenue from EV fleet services; burn rate unsustainable.",
    tradeWindow: "2–6 days",
    entryZone: "$0.24–$0.27",
    targetZone: "$0.35–$0.43",
    stopZone: "$0.20",
    status: "High Delisting Risk",
    volume: "1.9M",
    chart: [
      { d: "W1", p: 0.74 },
      { d: "W2", p: 0.58 },
      { d: "W3", p: 0.47 },
      { d: "W4", p: 0.39 },
      { d: "W5", p: 0.33 },
      { d: "W6", p: 0.29 },
      { d: "W7", p: 0.25 },
      { d: "W8", p: 0.28 },
    ],
  },
  {
    ticker: "MVST",
    company: "Microvast Holdings",
    price: 0.53,
    exchange: "NASDAQ",
    industry: "EV Battery",
    daysUnderOne: 89,
    daysToDeadline: 91,
    bounceProbability: 49,
    delistingRisk: 57,
    complianceScore: 54,
    financialScore: 29,
    operatorScore: 44,
    industryScore: 48,
    patternScore: 52,
    tradabilityScore: 66,
    operatorNote: "SPAC legacy with improving operations; execution risk remains elevated.",
    financialNote: "Revenue growing but profitability still distant; cash position shrinking.",
    tradeWindow: "4–12 days",
    entryZone: "$0.48–$0.52",
    targetZone: "$0.63–$0.73",
    stopZone: "$0.43",
    status: "Management Action Likely",
    volume: "2.3M",
    chart: [
      { d: "W1", p: 1.14 },
      { d: "W2", p: 0.97 },
      { d: "W3", p: 0.83 },
      { d: "W4", p: 0.72 },
      { d: "W5", p: 0.63 },
      { d: "W6", p: 0.57 },
      { d: "W7", p: 0.49 },
      { d: "W8", p: 0.53 },
    ],
  },
  {
    ticker: "GLYC",
    company: "GlycoMimetics Inc",
    price: 0.47,
    exchange: "NASDAQ",
    industry: "Biotech",
    daysUnderOne: 76,
    daysToDeadline: 104,
    bounceProbability: 44,
    delistingRisk: 63,
    complianceScore: 48,
    financialScore: 22,
    operatorScore: 51,
    industryScore: 25,
    patternScore: 46,
    tradabilityScore: 42,
    operatorNote: "Clinical-stage with limited pipeline catalysts in the near term.",
    financialNote: "Cash runway under 12 months; next financing round is critical.",
    tradeWindow: "3–9 days",
    entryZone: "$0.42–$0.46",
    targetZone: "$0.56–$0.66",
    stopZone: "$0.38",
    status: "Management Action Likely",
    volume: "287K",
    chart: [
      { d: "W1", p: 1.02 },
      { d: "W2", p: 0.88 },
      { d: "W3", p: 0.76 },
      { d: "W4", p: 0.65 },
      { d: "W5", p: 0.58 },
      { d: "W6", p: 0.51 },
      { d: "W7", p: 0.43 },
      { d: "W8", p: 0.47 },
    ],
  },
  {
    ticker: "BFRI",
    company: "Biofrontera Inc",
    price: 0.41,
    exchange: "NASDAQ",
    industry: "Dermatology",
    daysUnderOne: 112,
    daysToDeadline: 68,
    bounceProbability: 38,
    delistingRisk: 74,
    complianceScore: 34,
    financialScore: 31,
    operatorScore: 46,
    industryScore: 52,
    patternScore: 39,
    tradabilityScore: 44,
    operatorNote: "Commercializing niche dermatology product; growth has plateaued.",
    financialNote: "Revenue exists but losses persist; runway extension needed.",
    tradeWindow: "3–8 days",
    entryZone: "$0.37–$0.40",
    targetZone: "$0.50–$0.58",
    stopZone: "$0.33",
    status: "High Delisting Risk",
    volume: "412K",
    chart: [
      { d: "W1", p: 0.92 },
      { d: "W2", p: 0.79 },
      { d: "W3", p: 0.68 },
      { d: "W4", p: 0.59 },
      { d: "W5", p: 0.52 },
      { d: "W6", p: 0.46 },
      { d: "W7", p: 0.38 },
      { d: "W8", p: 0.41 },
    ],
  },
  {
    ticker: "HYMC",
    company: "Hycroft Mining Holding",
    price: 0.46,
    exchange: "NASDAQ",
    industry: "Gold Mining",
    daysUnderOne: 94,
    daysToDeadline: 86,
    bounceProbability: 42,
    delistingRisk: 66,
    complianceScore: 45,
    financialScore: 27,
    operatorScore: 48,
    industryScore: 55,
    patternScore: 44,
    tradabilityScore: 51,
    operatorNote: "Mining restart remains capital-intensive with commodity price dependency.",
    financialNote: "No operating revenue; fully dependent on equity markets to fund restart.",
    tradeWindow: "3–10 days",
    entryZone: "$0.41–$0.45",
    targetZone: "$0.56–$0.66",
    stopZone: "$0.37",
    status: "Management Action Likely",
    volume: "543K",
    chart: [
      { d: "W1", p: 1.06 },
      { d: "W2", p: 0.89 },
      { d: "W3", p: 0.76 },
      { d: "W4", p: 0.65 },
      { d: "W5", p: 0.57 },
      { d: "W6", p: 0.51 },
      { d: "W7", p: 0.43 },
      { d: "W8", p: 0.46 },
    ],
  },
  {
    ticker: "PRST",
    company: "Presto Automation Inc",
    price: 0.54,
    exchange: "NASDAQ",
    industry: "AI Restaurant Tech",
    daysUnderOne: 71,
    daysToDeadline: 109,
    bounceProbability: 47,
    delistingRisk: 59,
    complianceScore: 51,
    financialScore: 33,
    operatorScore: 52,
    industryScore: 61,
    patternScore: 48,
    tradabilityScore: 56,
    operatorNote: "AI drive-through product shows traction; contract wins are slow.",
    financialNote: "Revenue growing modestly but still cash-negative on operations.",
    tradeWindow: "4–11 days",
    entryZone: "$0.49–$0.53",
    targetZone: "$0.64–$0.74",
    stopZone: "$0.44",
    status: "Management Action Likely",
    volume: "318K",
    chart: [
      { d: "W1", p: 1.09 },
      { d: "W2", p: 0.93 },
      { d: "W3", p: 0.81 },
      { d: "W4", p: 0.72 },
      { d: "W5", p: 0.64 },
      { d: "W6", p: 0.58 },
      { d: "W7", p: 0.50 },
      { d: "W8", p: 0.54 },
    ],
  },
  {
    ticker: "WKSP",
    company: "Worksport Ltd",
    price: 0.63,
    exchange: "NASDAQ",
    industry: "Clean Energy Products",
    daysUnderOne: 54,
    daysToDeadline: 126,
    bounceProbability: 53,
    delistingRisk: 51,
    complianceScore: 58,
    financialScore: 36,
    operatorScore: 55,
    industryScore: 59,
    patternScore: 54,
    tradabilityScore: 49,
    operatorNote: "Niche solar tonneau cover product with modest but real sales growth.",
    financialNote: "Low revenue but burn is manageable; next 2 quarters are pivotal.",
    tradeWindow: "5–14 days",
    entryZone: "$0.58–$0.62",
    targetZone: "$0.74–$0.84",
    stopZone: "$0.52",
    status: "Management Action Likely",
    volume: "227K",
    chart: [
      { d: "W1", p: 1.18 },
      { d: "W2", p: 1.02 },
      { d: "W3", p: 0.90 },
      { d: "W4", p: 0.80 },
      { d: "W5", p: 0.73 },
      { d: "W6", p: 0.67 },
      { d: "W7", p: 0.59 },
      { d: "W8", p: 0.63 },
    ],
  },
  {
    ticker: "GFAI",
    company: "Guardforce AI Co",
    price: 0.31,
    exchange: "NASDAQ",
    industry: "Security Robots",
    daysUnderOne: 163,
    daysToDeadline: 37,
    bounceProbability: 28,
    delistingRisk: 88,
    complianceScore: 24,
    financialScore: 21,
    operatorScore: 33,
    industryScore: 47,
    patternScore: 30,
    tradabilityScore: 38,
    operatorNote: "Asia-based security robot operator with governance transparency concerns.",
    financialNote: "Revenue present but margins thin; compliance timeline is nearly expired.",
    tradeWindow: "2–6 days",
    entryZone: "$0.27–$0.30",
    targetZone: "$0.38–$0.46",
    stopZone: "$0.23",
    status: "High Delisting Risk",
    volume: "189K",
    chart: [
      { d: "W1", p: 0.82 },
      { d: "W2", p: 0.67 },
      { d: "W3", p: 0.56 },
      { d: "W4", p: 0.47 },
      { d: "W5", p: 0.40 },
      { d: "W6", p: 0.35 },
      { d: "W7", p: 0.28 },
      { d: "W8", p: 0.31 },
    ],
  },
  {
    ticker: "ZAPP",
    company: "Zapp Electric Vehicles",
    price: 0.57,
    exchange: "NASDAQ",
    industry: "EV Micro-mobility",
    daysUnderOne: 68,
    daysToDeadline: 112,
    bounceProbability: 46,
    delistingRisk: 60,
    complianceScore: 52,
    financialScore: 28,
    operatorScore: 49,
    industryScore: 44,
    patternScore: 47,
    tradabilityScore: 41,
    operatorNote: "Asia-focused micro-EV with niche urban delivery appeal; execution slow.",
    financialNote: "Pre-revenue at scale; funding will determine survival horizon.",
    tradeWindow: "4–11 days",
    entryZone: "$0.52–$0.56",
    targetZone: "$0.68–$0.78",
    stopZone: "$0.46",
    status: "Management Action Likely",
    volume: "143K",
    chart: [
      { d: "W1", p: 1.11 },
      { d: "W2", p: 0.96 },
      { d: "W3", p: 0.84 },
      { d: "W4", p: 0.74 },
      { d: "W5", p: 0.67 },
      { d: "W6", p: 0.61 },
      { d: "W7", p: 0.53 },
      { d: "W8", p: 0.57 },
    ],
  },
  {
    ticker: "AEYE",
    company: "AudioEye Inc",
    price: 0.81,
    exchange: "NASDAQ",
    industry: "Digital Accessibility",
    daysUnderOne: 38,
    daysToDeadline: 142,
    bounceProbability: 63,
    delistingRisk: 41,
    complianceScore: 66,
    financialScore: 48,
    operatorScore: 62,
    industryScore: 67,
    patternScore: 61,
    tradabilityScore: 68,
    operatorNote: "SaaS accessibility platform with recurring revenue; regulatory tailwinds.",
    financialNote: "ARR growing; losses narrowing but not yet at breakeven.",
    tradeWindow: "6–18 days",
    entryZone: "$0.77–$0.80",
    targetZone: "$0.94–$1.04",
    stopZone: "$0.71",
    status: "Recovery Candidate",
    volume: "96K",
    chart: [
      { d: "W1", p: 1.37 },
      { d: "W2", p: 1.18 },
      { d: "W3", p: 1.05 },
      { d: "W4", p: 0.96 },
      { d: "W5", p: 0.90 },
      { d: "W6", p: 0.84 },
      { d: "W7", p: 0.79 },
      { d: "W8", p: 0.81 },
    ],
  },
  {
    ticker: "CTRM",
    company: "Castor Maritime Inc",
    price: 0.34,
    exchange: "NASDAQ",
    industry: "Dry Bulk Shipping",
    daysUnderOne: 178,
    daysToDeadline: 32,
    bounceProbability: 29,
    delistingRisk: 85,
    complianceScore: 26,
    financialScore: 24,
    operatorScore: 31,
    industryScore: 49,
    patternScore: 32,
    tradabilityScore: 52,
    operatorNote: "Serial diluter in a cyclical shipping market; track record is poor.",
    financialNote: "Charter revenue volatile; high debt load relative to asset value.",
    tradeWindow: "2–6 days",
    entryZone: "$0.30–$0.33",
    targetZone: "$0.41–$0.49",
    stopZone: "$0.26",
    status: "High Delisting Risk",
    volume: "2.1M",
    chart: [
      { d: "W1", p: 0.86 },
      { d: "W2", p: 0.71 },
      { d: "W3", p: 0.59 },
      { d: "W4", p: 0.49 },
      { d: "W5", p: 0.43 },
      { d: "W6", p: 0.38 },
      { d: "W7", p: 0.31 },
      { d: "W8", p: 0.34 },
    ],
  },
  {
    ticker: "SOPA",
    company: "Society Pass Inc",
    price: 0.37,
    exchange: "NASDAQ",
    industry: "E-Commerce / Loyalty",
    daysUnderOne: 146,
    daysToDeadline: 54,
    bounceProbability: 33,
    delistingRisk: 82,
    complianceScore: 28,
    financialScore: 19,
    operatorScore: 36,
    industryScore: 43,
    patternScore: 35,
    tradabilityScore: 40,
    operatorNote: "Southeast Asia loyalty network with fragmented execution and slow monetization.",
    financialNote: "Minimal revenue from marketplace; sustained by equity issuance.",
    tradeWindow: "2–7 days",
    entryZone: "$0.33–$0.36",
    targetZone: "$0.45–$0.53",
    stopZone: "$0.28",
    status: "High Delisting Risk",
    volume: "312K",
    chart: [
      { d: "W1", p: 0.88 },
      { d: "W2", p: 0.73 },
      { d: "W3", p: 0.60 },
      { d: "W4", p: 0.51 },
      { d: "W5", p: 0.45 },
      { d: "W6", p: 0.40 },
      { d: "W7", p: 0.34 },
      { d: "W8", p: 0.37 },
    ],
  },
  {
    ticker: "SGBX",
    company: "SG Blocks Inc",
    price: 0.61,
    exchange: "NASDAQ",
    industry: "Modular Construction",
    daysUnderOne: 62,
    daysToDeadline: 118,
    bounceProbability: 51,
    delistingRisk: 55,
    complianceScore: 56,
    financialScore: 38,
    operatorScore: 54,
    industryScore: 62,
    patternScore: 50,
    tradabilityScore: 46,
    operatorNote: "Container-based construction niche has real demand; project pipeline thin.",
    financialNote: "Project-based revenue is lumpy; operating cash flow inconsistent.",
    tradeWindow: "4–13 days",
    entryZone: "$0.56–$0.60",
    targetZone: "$0.72–$0.82",
    stopZone: "$0.50",
    status: "Management Action Likely",
    volume: "178K",
    chart: [
      { d: "W1", p: 1.16 },
      { d: "W2", p: 1.00 },
      { d: "W3", p: 0.88 },
      { d: "W4", p: 0.78 },
      { d: "W5", p: 0.71 },
      { d: "W6", p: 0.65 },
      { d: "W7", p: 0.57 },
      { d: "W8", p: 0.61 },
    ],
  },
  {
    ticker: "NXPL",
    company: "NextPlat Corp",
    price: 0.56,
    exchange: "NASDAQ",
    industry: "Space / Communications",
    daysUnderOne: 73,
    daysToDeadline: 107,
    bounceProbability: 48,
    delistingRisk: 58,
    complianceScore: 53,
    financialScore: 34,
    operatorScore: 50,
    industryScore: 57,
    patternScore: 49,
    tradabilityScore: 43,
    operatorNote: "Satellite communication services with small but growing government contracts.",
    financialNote: "Revenue present; path to profitability stretched but not implausible.",
    tradeWindow: "4–12 days",
    entryZone: "$0.51–$0.55",
    targetZone: "$0.66–$0.76",
    stopZone: "$0.45",
    status: "Management Action Likely",
    volume: "214K",
    chart: [
      { d: "W1", p: 1.10 },
      { d: "W2", p: 0.95 },
      { d: "W3", p: 0.83 },
      { d: "W4", p: 0.73 },
      { d: "W5", p: 0.66 },
      { d: "W6", p: 0.60 },
      { d: "W7", p: 0.52 },
      { d: "W8", p: 0.56 },
    ],
  },
  {
    ticker: "ABVC",
    company: "ABVC BioPharma Inc",
    price: 0.36,
    exchange: "NASDAQ",
    industry: "Biotech / Pharma",
    daysUnderOne: 152,
    daysToDeadline: 48,
    bounceProbability: 30,
    delistingRisk: 83,
    complianceScore: 25,
    financialScore: 16,
    operatorScore: 34,
    industryScore: 27,
    patternScore: 33,
    tradabilityScore: 36,
    operatorNote: "Taiwan-based early-stage biotech; pipeline catalysts distant.",
    financialNote: "R&D-stage with no approved products; cash position deteriorating.",
    tradeWindow: "2–6 days",
    entryZone: "$0.32–$0.35",
    targetZone: "$0.43–$0.51",
    stopZone: "$0.27",
    status: "High Delisting Risk",
    volume: "267K",
    chart: [
      { d: "W1", p: 0.85 },
      { d: "W2", p: 0.70 },
      { d: "W3", p: 0.59 },
      { d: "W4", p: 0.50 },
      { d: "W5", p: 0.44 },
      { d: "W6", p: 0.39 },
      { d: "W7", p: 0.33 },
      { d: "W8", p: 0.36 },
    ],
  },
  {
    ticker: "NRSN",
    company: "NeuroSense Therapeutics",
    price: 0.71,
    exchange: "NASDAQ",
    industry: "Neurology Biotech",
    daysUnderOne: 44,
    daysToDeadline: 136,
    bounceProbability: 59,
    delistingRisk: 47,
    complianceScore: 63,
    financialScore: 39,
    operatorScore: 58,
    industryScore: 28,
    patternScore: 57,
    tradabilityScore: 53,
    operatorNote: "ALS-focused platform with Phase 2 data readout approaching.",
    financialNote: "Pre-revenue biotech; cash runway extends to mid-trial, then dependent on raises.",
    tradeWindow: "5–16 days",
    entryZone: "$0.67–$0.70",
    targetZone: "$0.82–$0.93",
    stopZone: "$0.61",
    status: "Recovery Candidate",
    volume: "148K",
    chart: [
      { d: "W1", p: 1.28 },
      { d: "W2", p: 1.11 },
      { d: "W3", p: 0.99 },
      { d: "W4", p: 0.90 },
      { d: "W5", p: 0.83 },
      { d: "W6", p: 0.76 },
      { d: "W7", p: 0.68 },
      { d: "W8", p: 0.71 },
    ],
  },
  {
    ticker: "CETX",
    company: "Cemtrex Inc",
    price: 0.44,
    exchange: "NASDAQ",
    industry: "Industrial / Tech",
    daysUnderOne: 108,
    daysToDeadline: 72,
    bounceProbability: 36,
    delistingRisk: 72,
    complianceScore: 37,
    financialScore: 30,
    operatorScore: 40,
    industryScore: 46,
    patternScore: 38,
    tradabilityScore: 45,
    operatorNote: "Diversified small-cap with industrial and tech subsidiaries; unclear focus.",
    financialNote: "Aggregate revenue exists but margins and debt load are concerning.",
    tradeWindow: "3–9 days",
    entryZone: "$0.39–$0.43",
    targetZone: "$0.53–$0.61",
    stopZone: "$0.34",
    status: "High Delisting Risk",
    volume: "231K",
    chart: [
      { d: "W1", p: 0.96 },
      { d: "W2", p: 0.81 },
      { d: "W3", p: 0.70 },
      { d: "W4", p: 0.61 },
      { d: "W5", p: 0.54 },
      { d: "W6", p: 0.48 },
      { d: "W7", p: 0.40 },
      { d: "W8", p: 0.44 },
    ],
  },
];

const TICKERS = stockDefinitions.map((s) => s.ticker);

// ---------------------------------------------------------------------------
// fetchLivePrices
// ---------------------------------------------------------------------------
// Attempts to build a price map from Polygon (batch) when POLYGON_API_KEY is
// present.  For any tickers not covered by Polygon, Alpha Vantage is tried as
// an individual fallback when ALPHA_VANTAGE_KEY is set.  Yahoo Finance is used
// for all remaining tickers (or as the sole source when no API keys are set).

/** Price and volume snapshot used internally by the stocks route. */
interface PriceInfo {
  price: number;
  /** Human-readable volume string (e.g. '1.5M', '500K') — not a raw number. */
  volume: string;
  /** Unix timestamp (ms) of when the price was fetched. */
  fetchedAt: number;
}

/**
 * Format a raw volume number into a human-readable string with K/M suffixes.
 * Returns null for undefined or non-finite inputs.
 */
function formatVol(vol: number | undefined): string | null {
  if (vol == null || !isFinite(vol)) return null;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return String(vol);
}

/**
 * Build a price map for the given tickers using the best available sources.
 *
 * Priority order:
 *  1. Polygon batch snapshot (when POLYGON_API_KEY is set)
 *  2. Alpha Vantage per-ticker (when ALPHA_VANTAGE_KEY is set, for any tickers
 *     not covered by Polygon)
 *  3. Yahoo Finance for all remaining tickers
 *
 * @param tickers - Uppercase ticker symbols to look up.
 * @returns Map of ticker → PriceInfo for every ticker that could be priced.
 */
async function fetchLivePrices(
  tickers: string[],
): Promise<Map<string, PriceInfo>> {
  const now = Date.now();
  const result = new Map<string, PriceInfo>();

  // --- Polygon batch ---
  if (process.env.POLYGON_API_KEY) {
    try {
      const polygonData = await fetchPolygonBatch(tickers);
      for (const [sym, data] of polygonData) {
        result.set(sym, {
          price: data.price,
          volume: formatVol(data.volume) ?? "—",
          fetchedAt: now,
        });
      }
    } catch (err) {
      logger.warn({ err }, "Polygon batch fetch failed — continuing to fallbacks");
    }
  }

  // --- Alpha Vantage per-ticker (for any still missing) ---
  if (process.env.ALPHA_VANTAGE_KEY) {
    const missing = tickers.filter((t) => !result.has(t));
    await Promise.all(
      missing.map(async (ticker) => {
        try {
          const data: RawMarketData = await fetchAlphaVantage(ticker);
          result.set(ticker, {
            price: data.price,
            volume: formatVol(data.volume) ?? "—",
            fetchedAt: now,
          });
        } catch (err) {
          logger.warn(
            { ticker, err },
            "Alpha Vantage fetch failed for ticker — falling through to Yahoo Finance",
          );
        }
      }),
    );
  }

  // --- Yahoo Finance for any still missing ---
  const stillMissing = tickers.filter((t) => !result.has(t));
  if (stillMissing.length > 0) {
    const yahooQuotes = await fetchQuotes(stillMissing);
    for (const [sym, entry] of yahooQuotes) {
      result.set(sym, entry);
    }
  }

  return result;
}

async function buildLiveStockData() {
  const [quotes, ...histories] = await Promise.all([
    fetchLivePrices(TICKERS),
    ...TICKERS.map((t) => fetchWeeklyHistory(t)),
  ]);

  return stockDefinitions.map((def, i) => {
    const quote = quotes.get(def.ticker);
    const history = histories[i];
    const liveChart = history ?? def.chart;
    const livePrice = quote?.price ?? null;

    // Apply score engine: refine analyst-assigned scores using live market data.
    const adjusted = computeAdjustedScores(def, livePrice, liveChart);

    return {
      ...def,
      ...adjusted,
      price: quote?.price ?? def.price,
      volume: quote?.volume ?? def.volume,
      // Only set priceTimestamp when live price data was actually fetched.
      // undefined when falling back to static data so callers know no live
      // price is available rather than being misled by a current timestamp.
      priceTimestamp: quote ? new Date(quote.fetchedAt).toISOString() : undefined,
      chart: liveChart,
    };
  });
}

router.get("/stocks", async (req, res) => {
  const { q, status } = req.query as { q?: string; status?: string };

  try {
    let results = await buildLiveStockData();

    if (q) {
      const lower = q.toLowerCase();
      results = results.filter(
        (s) =>
          s.ticker.toLowerCase().includes(lower) ||
          s.company.toLowerCase().includes(lower) ||
          s.industry.toLowerCase().includes(lower)
      );
    }

    if (status && status !== "all") {
      results = results.filter((s) => s.status === status);
    }

    results.sort((a, b) => b.bounceProbability - a.bounceProbability);

    const parsed = ListStocksResponse.parse(results);
    res.json(parsed);
  } catch (err) {
    logger.error({ err }, "Failed to build or serve live stock data");
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

router.get("/stocks/:ticker", async (req, res) => {
  const { ticker } = req.params;
  const def = stockDefinitions.find(
    (s) => s.ticker.toUpperCase() === ticker.toUpperCase()
  );

  if (!def) {
    res.status(404).json({ error: "Stock not found" });
    return;
  }

  try {
    const [quotes, history] = await Promise.all([
      fetchLivePrices([def.ticker]),
      fetchWeeklyHistory(def.ticker),
    ]);

    const quote = quotes.get(def.ticker);
    const liveChart = history ?? def.chart;
    const livePrice = quote?.price ?? null;

    const adjusted = computeAdjustedScores(def, livePrice, liveChart);

    const stock = {
      ...def,
      ...adjusted,
      price: quote?.price ?? def.price,
      volume: quote?.volume ?? def.volume,
    priceTimestamp: quote ? new Date(quote.fetchedAt).toISOString() : undefined,
      chart: liveChart,
    };

    const parsed = GetStockResponse.parse(stock);
    res.json(parsed);
  } catch (err) {
    logger.error({ err, ticker: def.ticker }, "Failed to build or serve live stock detail");
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

router.get("/stocks/:ticker/news", async (req, res) => {
  const { ticker } = req.params;
  const limitRaw = req.query.limit;
  const limit = limitRaw !== undefined ? Math.max(1, Math.min(50, Number(limitRaw) || 10)) : 10;

  const def = stockDefinitions.find(
    (s) => s.ticker.toUpperCase() === ticker.toUpperCase()
  );

  if (!def) {
    res.status(404).json({ error: "Stock not found" });
    return;
  }

  try {
    const news = await fetchStockNews(def.ticker, limit);
    const parsed = GetStockNewsResponse.parse(news);
    res.json(parsed);
  } catch (err) {
    logger.warn({ err, ticker: def.ticker }, "Failed to fetch news — returning empty list");
    res.json([]);
  }
});

export default router;

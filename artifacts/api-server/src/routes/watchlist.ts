import { Router, type IRouter } from "express";
import {
  GetWatchlistResponse,
  AddToWatchlistResponse,
  RemoveFromWatchlistResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const watchlist = new Set<string>();

router.get("/watchlist", (_req, res) => {
  const parsed = GetWatchlistResponse.parse({ tickers: [...watchlist] });
  res.json(parsed);
});

router.post("/watchlist/:ticker", (req, res) => {
  const { ticker } = req.params;
  watchlist.add(ticker.toUpperCase());
  const parsed = AddToWatchlistResponse.parse({ tickers: [...watchlist] });
  res.json(parsed);
});

router.delete("/watchlist/:ticker", (req, res) => {
  const { ticker } = req.params;
  watchlist.delete(ticker.toUpperCase());
  const parsed = RemoveFromWatchlistResponse.parse({ tickers: [...watchlist] });
  res.json(parsed);
});

export default router;

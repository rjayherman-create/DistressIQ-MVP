import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stocksRouter from "./stocks";
import watchlistRouter from "./watchlist";
import alertsRouter from "./alerts";
import authRouter from "./auth";
import pricesRouter from "./prices";
import aiRouter from "./ai";
import delistingRiskRouter from "./delisting-risk";
import wishlistItemsRouter from "./wishlist-items";
import diagnosticsRouter from "./diagnostics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(stocksRouter);
router.use(watchlistRouter);
router.use(alertsRouter);
router.use(pricesRouter);
router.use(aiRouter);
router.use(delistingRiskRouter);
router.use(wishlistItemsRouter);
router.use(diagnosticsRouter);

export default router;

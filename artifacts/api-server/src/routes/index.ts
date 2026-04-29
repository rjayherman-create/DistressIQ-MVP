import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stocksRouter from "./stocks";
import watchlistRouter from "./watchlist";
import alertsRouter from "./alerts";
import authRouter from "./auth";
import pricesRouter from "./prices";
import analysisRouter from "./analysis";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(stocksRouter);
router.use(watchlistRouter);
router.use(alertsRouter);
router.use(pricesRouter);
router.use(analysisRouter);

export default router;

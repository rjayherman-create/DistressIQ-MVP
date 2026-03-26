import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stocksRouter from "./stocks";
import watchlistRouter from "./watchlist";
import alertsRouter from "./alerts";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(stocksRouter);
router.use(watchlistRouter);
router.use(alertsRouter);

export default router;

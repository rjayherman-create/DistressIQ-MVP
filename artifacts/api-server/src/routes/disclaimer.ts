import { Router, type IRouter, type Request, type Response } from "express";
import { logDisclaimerAcceptance } from "../lib/disclaimer";

const router: IRouter = Router();

router.post(
  "/accept-disclaimer",
  (req: Request, res: Response) => logDisclaimerAcceptance(req, res),
);

export default router;

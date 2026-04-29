import { Router, type IRouter } from "express";
import { ListAlertsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const alerts = [
  {
    id: "1",
    message: "ALXO moved within 4% of the $1 recovery line",
    ticker: "ALXO",
    severity: "warning" as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    message: "FFIE volume expanded more than 2.5x average",
    ticker: "FFIE",
    severity: "info" as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    message: "GAME remains late-stage after extension window",
    ticker: "GAME",
    severity: "critical" as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    message: "TELA created a tighter support band near $0.78",
    ticker: "TELA",
    severity: "info" as const,
    createdAt: new Date().toISOString(),
  },
];

router.get("/alerts", (_req, res) => {
  const parsed = ListAlertsResponse.parse(alerts);
  res.json(parsed);
});

export default router;

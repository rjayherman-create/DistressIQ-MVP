import { Router, type IRouter } from "express";
import { StockAnalysisSchema } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * Static analysis data keyed by ticker.
 * In production this would be replaced by a real AI call whose raw output
 * is validated through StockAnalysisSchema before being returned.
 */
const analysisData: Record<
  string,
  {
    price: number;
    daysBelowOne: number;
    bounceProbability: number;
    status: "Recovery Candidate" | "High Risk" | "Delisting Likely" | "Watch";
    confidence: number;
  }
> = {
  TELA: {
    price: 0.83,
    daysBelowOne: 47,
    bounceProbability: 68,
    status: "Recovery Candidate",
    confidence: 0.74,
  },
  GAME: {
    price: 0.29,
    daysBelowOne: 212,
    bounceProbability: 39,
    status: "Delisting Likely",
    confidence: 0.81,
  },
  FFIE: {
    price: 0.35,
    daysBelowOne: 58,
    bounceProbability: 54,
    status: "High Risk",
    confidence: 0.60,
  },
  ALXO: {
    price: 0.96,
    daysBelowOne: 29,
    bounceProbability: 71,
    status: "Recovery Candidate",
    confidence: 0.82,
  },
};

router.get("/stocks/:ticker/analysis", (req, res) => {
  const { ticker } = req.params;
  const entry = analysisData[ticker.toUpperCase()];

  if (!entry) {
    res.status(404).json({ error: "Stock not found" });
    return;
  }

  const aiOutput = { ticker: ticker.toUpperCase(), ...entry };

  const result = StockAnalysisSchema.safeParse(aiOutput);

  if (!result.success) {
    res
      .status(502)
      .json({ error: "AI output invalid — blocked", details: result.error.issues });
    return;
  }

  res.json(result.data);
});

export default router;

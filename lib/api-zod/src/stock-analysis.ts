import { z } from "zod";

/**
 * Schema for validating AI-generated stock analysis output.
 * Ensures AI responses conform to expected structure and ranges
 * before the data reaches the client.
 */
export const StockAnalysisSchema = z.object({
  ticker: z.string(),
  price: z.number(),
  daysBelowOne: z.number(),
  bounceProbability: z.number().min(0).max(100),
  status: z.enum([
    "Recovery Candidate",
    "High Risk",
    "Delisting Likely",
    "Watch",
  ]),
  confidence: z.number().min(0).max(1),
});

export type StockAnalysis = z.infer<typeof StockAnalysisSchema>;

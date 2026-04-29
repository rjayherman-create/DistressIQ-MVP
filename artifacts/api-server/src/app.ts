import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import nodePath from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const frontendPath = nodePath.join(
    process.cwd(),
    "artifacts/distressiq/dist/public",
  );
  app.use(express.static(frontendPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.sendFile(nodePath.join(frontendPath, "index.html"));
  });
}

export default app;

import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { timestampMiddleware } from "./lib/timestamp";
import { injectDisclaimer } from "./lib/disclaimer";

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
app.use(timestampMiddleware);
app.use(authMiddleware);
// Inject disclaimer into every JSON response
app.use(injectDisclaimer);

app.use(express.static(path.join(__dirname, "../../distressiq/dist/public")));

app.use("/api", router);

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../../distressiq/dist/public/index.html"));
});

export default app;

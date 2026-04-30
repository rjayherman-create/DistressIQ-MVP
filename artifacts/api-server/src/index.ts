import app from "./app";
import { logger } from "./lib/logger";
import { runBackgroundScanner } from "./routes/scan";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// Background scan loop — runs every 60 seconds (Railway-compatible).
// Scans all defined tickers for pre-delisting signals and updates the
// in-memory tracking store with any new alert messages.
const scanInterval = setInterval(() => {
  logger.debug("Running background stock scanner");
  runBackgroundScanner().catch((err: unknown) => {
    logger.error({ err }, "Background scanner error");
  });
}, 60_000);

// Clear the interval on graceful shutdown so the process can exit cleanly.
process.once("SIGTERM", () => {
  clearInterval(scanInterval);
});
process.once("SIGINT", () => {
  clearInterval(scanInterval);
});

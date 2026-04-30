import app from "./app";
import { logger } from "./lib/logger";
import cron from "node-cron";
import { runDelistingScan } from "./lib/delisting-scan";

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

  // Run the delisting risk scan daily at 02:00 UTC.
  cron.schedule("0 2 * * *", async () => {
    logger.info("delisting-scan: cron triggered daily scan");
    try {
      await runDelistingScan(/* force */ true);
    } catch (err) {
      logger.error({ err }, "delisting-scan: cron scan failed");
    }
  });
});

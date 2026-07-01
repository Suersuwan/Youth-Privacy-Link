import express, { type Express, Request, Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import webhookRouter from "./routes/webhook.js";
import { logger } from "./lib/logger.js";

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

app.use(cors());

app.use(
  express.json({
    verify(_req: Request, _res: Response, buf: Buffer) {
      (_req as Request & { rawBody: Buffer }).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/webhook", webhookRouter);

export default app;

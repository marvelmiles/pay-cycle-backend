import "dotenv/config";
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import connectDB from "./config/database";
import logger from "./utils/logger";
import paymentRouter from "./routes/payment";
import authRouter from "./routes/auth";
import customerRouter from "./routes/customer";
import productRouter from "./routes/product";
import trxRouter from "./routes/transaction";
import { errorHandler, notFound } from "./middleware/error";
import { globalLimiter } from "./middleware/request";
import analyticRouter from "./routes/analytic";
import profileRouter from "./routes/profile";

const app: Application = express();

app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

connectDB();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: process.env.APP_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  }),
);

app.use("/api", globalLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());

app.use("/api/v1", authRouter);
app.use("/api/v1", profileRouter);
app.use("/api/v1", customerRouter);
app.use("/api/v1", paymentRouter);
app.use("/api/v1", productRouter);
app.use("/api/v1", trxRouter);
app.use("/api/v1", analyticRouter);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// process.on("SIGTERM", () => {
//   logger.info("SIGTERM received. Shutting down gracefully...");
//   server.close(() => {
//     logger.info("Server closed");
//     process.exit(0);
//   });
// });

// process.on("unhandledRejection", (err: Error) => {
//   logger.error(`Unhandled Rejection: ${err.message}`);
//   server.close(() => process.exit(1));
// });

export default app;

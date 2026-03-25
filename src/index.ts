import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import connectDB from "./config/database";
import apiRoutes from "./routes/index";
import billingRoutes from "./routes/billing.routes";
import { errorHandler, notFound } from "./middleware/auth.middleware";
import logger from "./utils/logger";

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== CONNECT DB ====================
connectDB();

// ==================== SECURITY MIDDLEWARE ====================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  }),
);

// ==================== RATE LIMITING ====================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many auth attempts, try again in 15 minutes.",
  },
});

app.use("/api", globalLimiter);
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

// ==================== BODY PARSING ====================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());

// ==================== LOGGING ====================
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ==================== HEALTH CHECK ====================
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "BillFlow API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV,
  });
});

// ==================== API ROUTES ====================
app.use("/api/v1", apiRoutes);
app.use("/api/v1", billingRoutes);

// ==================== WEBHOOK ENDPOINT (Interswitch) ====================
app.post(
  "/webhooks/interswitch",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-interswitch-signature"] as string;
      const payload = req.body;
      logger.info(`Webhook received: ${JSON.stringify(payload)}`);
      // TODO: verify signature and process event
      res.json({ success: true });
    } catch (error) {
      logger.error(`Webhook error: ${error}`);
      res.status(500).json({ success: false });
    }
  },
);

// ==================== ERROR HANDLING ====================
app.use(notFound);
app.use(errorHandler);

// ==================== START SERVER ====================
const server = app.listen(PORT, () => {
  logger.info(
    `🚀 BillFlow API running on port ${PORT} [${process.env.NODE_ENV}]`,
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("unhandledRejection", (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

export default app;

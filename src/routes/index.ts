import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller";
import * as productCtrl from "../controllers/products.controller";
import * as customerCtrl from "../controllers/customers.controller";
import * as transactionCtrl from "../controllers/transactions.controller";
import * as subscriptionCtrl from "../controllers/subscriptions.controller";
import * as analyticsCtrl from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth.middleware";

const router: any = Router();

// ==================== AUTH ====================
router.post("/auth/register", authCtrl.register);
router.post("/auth/login", authCtrl.login);
router.post("/auth/refresh", authCtrl.refreshToken);
router.get("/auth/me", authenticate, authCtrl.getMe);
router.post("/auth/logout", authenticate, authCtrl.logout);

// ==================== PRODUCTS ====================
router.get("/products", authenticate, productCtrl.getProducts);
router.get("/products/:id", authenticate, productCtrl.getProduct);
router.post("/products", authenticate, productCtrl.createProduct);
router.put("/products/:id", authenticate, productCtrl.updateProduct);
router.delete("/products/:id", authenticate, productCtrl.deleteProduct);

// ==================== CUSTOMERS ====================
router.get("/customers", authenticate, customerCtrl.getCustomers);
router.get("/customers/:id", authenticate, customerCtrl.getCustomer);
router.post("/customers", authenticate, customerCtrl.createCustomer);
router.put("/customers/:id", authenticate, customerCtrl.updateCustomer);

// ==================== TRANSACTIONS ====================
router.get("/transactions", authenticate, transactionCtrl.getTransactions);
router.get("/transactions/:id", authenticate, transactionCtrl.getTransaction);
router.post(
  "/transactions/initiate",
  authenticate,
  transactionCtrl.initiatePayment,
);
router.get(
  "/transactions/verify/:reference",
  authenticate,
  transactionCtrl.verifyPayment,
);

// ==================== SUBSCRIPTIONS ====================
router.get("/subscriptions", authenticate, subscriptionCtrl.getSubscriptions);
router.get(
  "/subscriptions/:id",
  authenticate,
  subscriptionCtrl.getSubscription,
);
router.post(
  "/subscriptions/:id/cancel",
  authenticate,
  subscriptionCtrl.cancelSubscription,
);
router.post(
  "/subscriptions/:id/pause",
  authenticate,
  subscriptionCtrl.pauseSubscription,
);
router.post(
  "/subscriptions/:id/resume",
  authenticate,
  subscriptionCtrl.resumeSubscription,
);

// ==================== ANALYTICS ====================
router.get(
  "/analytics/dashboard",
  authenticate,
  analyticsCtrl.getDashboardStats,
);
router.get("/analytics/revenue", authenticate, analyticsCtrl.getRevenueChart);
router.get(
  "/analytics/subscriptions",
  authenticate,
  analyticsCtrl.getSubscriptionMetrics,
);

export default router;

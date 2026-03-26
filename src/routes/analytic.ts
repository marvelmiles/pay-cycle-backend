import { IRouter, Router } from "express";
import { authenticate } from "../middleware/auth";
import { getDashboardStats, getRevenueChart } from "../controllers/analytics";

const analyticRouter: IRouter = Router();

analyticRouter.get("/analytics/dashboard", authenticate, getDashboardStats);
analyticRouter.get("/analytics/revenue", authenticate, getRevenueChart);

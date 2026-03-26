import { IRouter, Router } from "express";
import {
  getMe,
  login,
  logout,
  refreshToken,
  register,
} from "../controllers/auth";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/request";

const authRouter: IRouter = Router();

authRouter.post("/auth/register", authLimiter, register);
authRouter.post("/auth/login", authLimiter, login);
authRouter.post("/auth/refresh", refreshToken);
authRouter.get("/auth/me", authenticate, getMe);
authRouter.post("/auth/logout", authenticate, logout);

export default authRouter;

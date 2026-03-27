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
import {
  loginValidator,
  refreshValidator,
  registerValidator,
} from "../validators/auth";
import { validate } from "../middleware/validator";

const authRouter: IRouter = Router();

authRouter.post(
  "/auth/register",
  authLimiter,
  registerValidator,
  validate,
  register,
);
authRouter.post("/auth/login", authLimiter, loginValidator, validate, login);
authRouter.post("/auth/refresh", refreshValidator, validate, refreshToken);
authRouter.get("/auth/me", authenticate, getMe);
authRouter.post("/auth/logout", authenticate, logout);

export default authRouter;

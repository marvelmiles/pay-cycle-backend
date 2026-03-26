import { IRouter, Router } from "express";
import { authenticate } from "../middleware/auth";
import { getProfile, updateProfile } from "../controllers/profile";

const profileRouter: IRouter = Router();

profileRouter.get("/profile/me", authenticate, getProfile);

profileRouter.put("/profile/update", authenticate, updateProfile);

export default profileRouter;

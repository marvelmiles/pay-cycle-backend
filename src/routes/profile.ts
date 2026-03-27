import { IRouter, Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getProfile,
  updateProfile,
  updateProfileBussiness,
} from "../controllers/profile";
import { upload } from "../utils/stream";

const profileRouter: IRouter = Router();

profileRouter.get("/profile/me", authenticate, getProfile);

profileRouter.put(
  "/profile/me",
  authenticate,
  upload.single("image"),
  updateProfile,
);

profileRouter.put(
  "/profile/business/:id",
  authenticate,
  upload.single("image"),
  updateProfileBussiness,
);

export default profileRouter;

import { IRouter, Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  cancelWithdrawalRequest,
  createWithdrawRequest,
  getWalletDetails,
  getWithdrawals,
} from "../controllers/wallet";

const walletRouter: IRouter = Router();

walletRouter.get("/wallet/:businessId", authenticate, getWalletDetails);

walletRouter.get(
  "/wallet/withdrawals/:businessId",
  authenticate,
  getWithdrawals,
);

walletRouter.post(
  "/wallet/withdraw/:businessId",
  authenticate,
  createWithdrawRequest,
);

walletRouter.post(
  "/wallet/withdraw/:id/:businessId/cancel",
  authenticate,
  cancelWithdrawalRequest,
);

export default walletRouter;

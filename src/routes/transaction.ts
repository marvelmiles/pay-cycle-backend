import { IRouter, Router } from "express";
import { authenticate } from "../middleware/auth";
import { getTransaction, getTransactions } from "../controllers/transactions";

const trxRouter: IRouter = Router();

trxRouter.get("/transactions", authenticate, getTransactions);
trxRouter.get("/transactions/:id", authenticate, getTransaction);

export default trxRouter;

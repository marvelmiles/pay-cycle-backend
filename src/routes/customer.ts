import { IRouter, Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createCustomer,
  getCustomer,
  getCustomers,
  updateCustomer,
} from "../controllers/customers";

const customerRouter: IRouter = Router();

customerRouter.get("/customers", authenticate, getCustomers);
customerRouter.get("/customers/:id", authenticate, getCustomer);
customerRouter.post("/customers", authenticate, createCustomer);
customerRouter.put("/customers/:id", authenticate, updateCustomer);

export default customerRouter;

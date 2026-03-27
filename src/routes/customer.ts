import { IRouter, Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createCustomer,
  getCustomer,
  getCustomers,
  updateCustomer,
} from "../controllers/customers";
import {
  createCustomerValidator,
  updateCustomerValidator,
} from "../validators/customers";
import { validate } from "../middleware/validator";

const customerRouter: IRouter = Router();

customerRouter.get("/customers", authenticate, getCustomers);
customerRouter.get("/customers/:id", authenticate, getCustomer);
customerRouter.post(
  "/customers",
  authenticate,
  createCustomerValidator,
  validate,
  createCustomer,
);
customerRouter.put(
  "/customers/:id",
  authenticate,
  updateCustomerValidator,
  validate,
  updateCustomer,
);

export default customerRouter;

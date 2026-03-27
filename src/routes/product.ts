import { IRouter, Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/products";
import {
  createProductValidator,
  updateProductValidator,
} from "../validators/products";
import { validate } from "../middleware/validator";

const productRouter: IRouter = Router();

productRouter.get("/products", authenticate, getProducts);
productRouter.get("/products/:id", authenticate, getProduct);
productRouter.post(
  "/products",
  authenticate,
  createProductValidator,
  validate,
  createProduct,
);
productRouter.put(
  "/products/:id",
  authenticate,
  updateProductValidator,
  validate,
  updateProduct,
);
productRouter.delete("/products/:id", authenticate, deleteProduct);

export default productRouter;

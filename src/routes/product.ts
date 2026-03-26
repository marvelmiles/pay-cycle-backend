import { IRouter, Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/products";

const productRouter: IRouter = Router();

productRouter.get("/products", authenticate, getProducts);
productRouter.get("/products/:id", authenticate, getProduct);
productRouter.post("/products", authenticate, createProduct);
productRouter.put("/products/:id", authenticate, updateProduct);
productRouter.delete("/products/:id", authenticate, deleteProduct);

export default productRouter;

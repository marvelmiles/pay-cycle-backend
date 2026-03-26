import { Request } from "express";

export interface AuthReq extends Request {
  user?: { id: string };
}

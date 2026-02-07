import { Router } from "express";
import { requireAuth } from "@clerk/express";
import {
  createCheckoutSession,
  getSessionStatus,
  getStripeConfig,
} from "../application/payment";

const paymentsRouter = Router();

paymentsRouter.get("/config", getStripeConfig);
paymentsRouter.post("/create-checkout-session", requireAuth(), createCheckoutSession);
paymentsRouter.get("/session-status", getSessionStatus);

export default paymentsRouter;

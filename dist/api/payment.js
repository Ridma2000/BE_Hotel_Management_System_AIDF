"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_2 = require("@clerk/express");
const payment_1 = require("../application/payment");
const paymentsRouter = (0, express_1.Router)();
paymentsRouter.get("/config", payment_1.getStripeConfig);
paymentsRouter.post("/create-checkout-session", (0, express_2.requireAuth)(), payment_1.createCheckoutSession);
paymentsRouter.get("/session-status", payment_1.getSessionStatus);
exports.default = paymentsRouter;
//# sourceMappingURL=payment.js.map
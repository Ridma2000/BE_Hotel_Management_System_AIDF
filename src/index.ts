import "dotenv/config";

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";

import hotelsRouter from "./api/hotel";
import connectDB from "./infrastructure/db";
import reviewRouter from "./api/review";
import locationsRouter from "./api/location";
import bookingsRouter from "./api/booking";
import paymentsRouter from "./api/payment";
import globalErrorHandlingMiddleware from "./api/middleware/global-error-handling-middleware";
import { handleWebhook } from "./application/payment";

import { clerkMiddleware } from "@clerk/express";

console.log("Environment check:");
console.log("- MONGODB_URL:", process.env.MONGODB_URL ? "✓ Set" : "✗ Missing");
console.log("- CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY ? "✓ Set" : "✗ Missing");
console.log("- CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "✓ Set" : "✗ Missing");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.post(
  "/api/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  handleWebhook
);

app.use(express.json());
app.use(clerkMiddleware());

app.get("/api/auth-test", (req, res) => {
  const { getAuth } = require("@clerk/express");
  const auth = getAuth(req);
  res.json({
    isAuthenticated: !!auth.userId,
    userId: auth.userId,
    sessionClaims: auth.sessionClaims,
    hasAuthHeader: !!req.headers.authorization
  });
});

app.use("/api/hotels", hotelsRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/payments", paymentsRouter);

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../../aidf-front-end/dist");
  app.use(express.static(frontendPath));
  
  // Express 5 (path-to-regexp v8) requires a named wildcard for catch-all routes
  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

app.use(globalErrorHandlingMiddleware);

connectDB();

const PORT = parseInt(process.env.PORT || "8000", 10);
app.listen(PORT, () => {
  console.log("Server is listening on PORT: " , PORT);
});

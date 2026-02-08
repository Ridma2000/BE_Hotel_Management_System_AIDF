import "dotenv/config";

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";

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
console.log("- MONGODB_URL:", process.env.MONGODB_URL ? "Set" : "Missing");
console.log("- CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY ? "Set" : "Missing");
console.log("- CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "Set" : "Missing");
console.log("- FRONTEND_URL:", process.env.FRONTEND_URL || "Not set");
console.log("- CORS_ALLOWED_ORIGINS:", process.env.CORS_ALLOWED_ORIGINS || "Not set");

const app = express();

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((item) => item.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const cleanedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.length === 0 || allowedOrigins.includes(cleanedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS: ${cleanedOrigin} is not allowed`));
    },
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
    hasAuthHeader: !!req.headers.authorization,
  });
});

app.use("/api/hotels", hotelsRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/payments", paymentsRouter);

if (process.env.NODE_ENV === "production") {
  const frontendPath =
    process.env.FRONTEND_BUILD_PATH || path.join(__dirname, "../../aidf-front-end/dist");
  const indexFile = path.join(frontendPath, "index.html");

  if (fs.existsSync(indexFile)) {
    app.use(express.static(frontendPath));

    // Express 5 (path-to-regexp v8) requires a named wildcard for catch-all routes
    app.get("/{*path}", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(indexFile);
    });
  } else {
    console.warn(`Frontend bundle not found at ${indexFile}; skipping static file hosting.`);
  }
}

// Basic health check (useful when frontend is hosted elsewhere)
app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(globalErrorHandlingMiddleware);

connectDB();

const PORT = parseInt(process.env.PORT || "8000", 10);
app.listen(PORT, () => {
  console.log("Server is listening on PORT:", PORT);
});

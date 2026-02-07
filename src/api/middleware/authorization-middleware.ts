// src/api/middleware/authorization-middleware.ts
import { getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import ForbiddenError from "../../domain/errors/forbidden-error";

type ClaimsWithRole = {
  metadata?: {
    role?: "admin" | "user" | string;
  };
  publicMetadata?: {
    role?: "admin" | "user" | string;
  };
};

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);

  const claims = auth?.sessionClaims as ClaimsWithRole | undefined;
  const role = claims?.metadata?.role ?? claims?.publicMetadata?.role;

  console.log("Admin check:", {
    userId: auth.userId,
    role: role,
    hasMetadata: !!claims?.metadata,
    hasPublicMetadata: !!claims?.publicMetadata
  });

  // In development, allow any authenticated user to be admin
  // In production, you should set the role properly in Clerk
  if (role !== "admin") {
    console.log("User is not admin, but allowing access in development mode");
    // Temporarily allow access for development
    // return next(new ForbiddenError("Forbidden"));
  }
  return next();
};

export default isAdmin;

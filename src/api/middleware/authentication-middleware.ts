// src/api/middleware/authentication-middleware.ts
import UnauthorizedError from "../../domain/errors/unauthorized-error";
import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  console.log("Authentication check:", {
    userId: auth.userId,
    hasAuth: !!auth,
    authorizationHeader: req.headers.authorization ? "Present" : "Missing"
  });
  
  if (!auth.userId) {
    return next(new UnauthorizedError("Unauthorized - No user ID found"));
  }
  return next();
};

export default isAuthenticated;

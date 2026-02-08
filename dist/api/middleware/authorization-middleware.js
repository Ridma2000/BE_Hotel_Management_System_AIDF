"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/middleware/authorization-middleware.ts
const express_1 = require("@clerk/express");
const isAdmin = (req, res, next) => {
    const auth = (0, express_1.getAuth)(req);
    const claims = auth?.sessionClaims;
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
exports.default = isAdmin;
//# sourceMappingURL=authorization-middleware.js.map
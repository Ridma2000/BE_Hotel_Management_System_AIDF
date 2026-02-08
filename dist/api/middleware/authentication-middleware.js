"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/middleware/authentication-middleware.ts
const unauthorized_error_1 = __importDefault(require("../../domain/errors/unauthorized-error"));
const express_1 = require("@clerk/express");
const isAuthenticated = (req, res, next) => {
    const auth = (0, express_1.getAuth)(req);
    console.log("Authentication check:", {
        userId: auth.userId,
        hasAuth: !!auth,
        authorizationHeader: req.headers.authorization ? "Present" : "Missing"
    });
    if (!auth.userId) {
        return next(new unauthorized_error_1.default("Unauthorized - No user ID found"));
    }
    return next();
};
exports.default = isAuthenticated;
//# sourceMappingURL=authentication-middleware.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const hotel_1 = __importDefault(require("./api/hotel"));
const db_1 = __importDefault(require("./infrastructure/db"));
const review_1 = __importDefault(require("./api/review"));
const location_1 = __importDefault(require("./api/location"));
const booking_1 = __importDefault(require("./api/booking"));
const payment_1 = __importDefault(require("./api/payment"));
const global_error_handling_middleware_1 = __importDefault(require("./api/middleware/global-error-handling-middleware"));
const payment_2 = require("./application/payment");
const express_2 = require("@clerk/express");
console.log("Environment check:");
console.log("- MONGODB_URL:", process.env.MONGODB_URL ? "✓ Set" : "✗ Missing");
console.log("- CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY ? "✓ Set" : "✗ Missing");
console.log("- CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "✓ Set" : "✗ Missing");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.post("/api/stripe/webhook", body_parser_1.default.raw({ type: "application/json" }), payment_2.handleWebhook);
app.use(express_1.default.json());
app.use((0, express_2.clerkMiddleware)());
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
app.use("/api/hotels", hotel_1.default);
app.use("/api/reviews", review_1.default);
app.use("/api/locations", location_1.default);
app.use("/api/bookings", booking_1.default);
app.use("/api/payments", payment_1.default);
if (process.env.NODE_ENV === "production") {
    const frontendPath = path_1.default.join(__dirname, "../../aidf-front-end/dist");
    app.use(express_1.default.static(frontendPath));
    // Express 5 (path-to-regexp v8) requires a named wildcard for catch-all routes
    app.get("/{*path}", (req, res, next) => {
        if (req.path.startsWith("/api")) {
            return next();
        }
        res.sendFile(path_1.default.join(frontendPath, "index.html"));
    });
}
app.use(global_error_handling_middleware_1.default);
(0, db_1.default)();
const PORT = parseInt(process.env.PORT || "8000", 10);
app.listen(PORT, () => {
    console.log("Server is listening on PORT: ", PORT);
});
//# sourceMappingURL=index.js.map
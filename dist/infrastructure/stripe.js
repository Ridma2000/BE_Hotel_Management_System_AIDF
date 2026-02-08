"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripeClient = getStripeClient;
exports.getStripePublishableKey = getStripePublishableKey;
exports.getUncachedStripeClient = getUncachedStripeClient;
const stripe_1 = __importDefault(require("stripe"));
let stripeClient = null;
let stripePublishableKey = null;
async function getCredentials() {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
        ? "repl " + process.env.REPL_IDENTITY
        : process.env.WEB_REPL_RENEWAL
            ? "depl " + process.env.WEB_REPL_RENEWAL
            : null;
    if (!xReplitToken) {
        throw new Error("X_REPLIT_TOKEN not found for repl/depl");
    }
    const connectorName = "stripe";
    const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
    const targetEnvironment = isProduction ? "production" : "development";
    const url = new URL(`https://${hostname}/api/v2/connection`);
    url.searchParams.set("include_secrets", "true");
    url.searchParams.set("connector_names", connectorName);
    url.searchParams.set("environment", targetEnvironment);
    const response = await fetch(url.toString(), {
        headers: {
            Accept: "application/json",
            X_REPLIT_TOKEN: xReplitToken,
        },
    });
    const data = (await response.json());
    const connectionSettings = data.items?.[0];
    if (!connectionSettings ||
        !connectionSettings.settings.publishable ||
        !connectionSettings.settings.secret) {
        throw new Error(`Stripe ${targetEnvironment} connection not found`);
    }
    return {
        publishableKey: connectionSettings.settings.publishable,
        secretKey: connectionSettings.settings.secret,
    };
}
async function getStripeClient() {
    if (!stripeClient) {
        const { secretKey } = await getCredentials();
        stripeClient = new stripe_1.default(secretKey);
    }
    return stripeClient;
}
async function getStripePublishableKey() {
    if (!stripePublishableKey) {
        const { publishableKey } = await getCredentials();
        stripePublishableKey = publishableKey;
    }
    return stripePublishableKey;
}
async function getUncachedStripeClient() {
    const { secretKey } = await getCredentials();
    return new stripe_1.default(secretKey);
}
//# sourceMappingURL=stripe.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.getStripeConfig = exports.getSessionStatus = exports.createCheckoutSession = void 0;
const express_1 = require("@clerk/express");
const stripe_1 = require("../infrastructure/stripe");
const Booking_1 = __importDefault(require("../infrastructure/entities/Booking"));
const Hotel_1 = __importDefault(require("../infrastructure/entities/Hotel"));
const unauthorized_error_1 = __importDefault(require("../domain/errors/unauthorized-error"));
const not_found_error_1 = __importDefault(require("../domain/errors/not-found-error"));
const validation_error_1 = __importDefault(require("../domain/errors/validation-error"));
const FRONTEND_URL = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "http://localhost:8000";
const createCheckoutSession = async (req, res) => {
    const { userId } = (0, express_1.getAuth)(req);
    if (!userId) {
        throw new unauthorized_error_1.default("Unauthorized");
    }
    const { bookingId } = req.body;
    if (!bookingId) {
        throw new validation_error_1.default("Booking ID is required");
    }
    const booking = await Booking_1.default.findById(bookingId);
    if (!booking) {
        throw new not_found_error_1.default("Booking not found");
    }
    if (booking.userId !== userId) {
        throw new unauthorized_error_1.default("Not authorized to pay for this booking");
    }
    if (booking.paymentStatus === "PAID") {
        throw new validation_error_1.default("This booking has already been paid");
    }
    const hotel = await Hotel_1.default.findById(booking.hotelId);
    if (!hotel) {
        throw new not_found_error_1.default("Hotel not found");
    }
    if (!hotel.stripePriceId) {
        throw new validation_error_1.default("Stripe price ID is missing for this hotel. Please contact support.");
    }
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const numberOfNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const stripe = await (0, stripe_1.getStripeClient)();
    const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded",
        line_items: [
            {
                price: hotel.stripePriceId,
                quantity: numberOfNights,
            },
        ],
        mode: "payment",
        return_url: `${FRONTEND_URL}/booking/complete?session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
            bookingId: booking._id.toString(),
        },
    });
    res.json({ clientSecret: session.client_secret });
};
exports.createCheckoutSession = createCheckoutSession;
const getSessionStatus = async (req, res) => {
    const { session_id } = req.query;
    if (!session_id || typeof session_id !== "string") {
        throw new validation_error_1.default("Session ID is required");
    }
    const stripe = await (0, stripe_1.getStripeClient)();
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) {
        throw new not_found_error_1.default("Booking not found in session");
    }
    const booking = await Booking_1.default.findById(bookingId).populate("hotelId");
    if (!booking) {
        throw new not_found_error_1.default("Booking not found");
    }
    if (session.payment_status === "paid" && booking.paymentStatus !== "PAID") {
        await Booking_1.default.findByIdAndUpdate(bookingId, { paymentStatus: "PAID" });
        booking.paymentStatus = "PAID";
    }
    res.json({
        status: session.status,
        paymentStatus: session.payment_status,
        booking: booking,
        customerEmail: session.customer_details?.email,
    });
};
exports.getSessionStatus = getSessionStatus;
const getStripeConfig = async (req, res) => {
    const publishableKey = await (0, stripe_1.getStripePublishableKey)();
    res.json({ publishableKey });
};
exports.getStripeConfig = getStripeConfig;
async function fulfillCheckout(sessionId) {
    const stripe = await (0, stripe_1.getStripeClient)();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items"],
    });
    const bookingId = checkoutSession.metadata?.bookingId;
    if (!bookingId) {
        console.error("No bookingId in session metadata");
        return;
    }
    const booking = await Booking_1.default.findById(bookingId);
    if (!booking) {
        console.error("Booking not found:", bookingId);
        return;
    }
    if (booking.paymentStatus !== "PENDING") {
        console.log("Booking already processed:", bookingId);
        return;
    }
    if (checkoutSession.payment_status !== "unpaid") {
        await Booking_1.default.findByIdAndUpdate(bookingId, { paymentStatus: "PAID" });
        console.log("Booking marked as PAID:", bookingId);
    }
}
const handleWebhook = async (req, res) => {
    const stripe = await (0, stripe_1.getStripeClient)();
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        res.status(400).send("Missing stripe-signature header");
        return;
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET is not set");
        res.status(500).send("Webhook secret not configured");
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    console.log("Received webhook event:", event.type);
    if (event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded") {
        try {
            await fulfillCheckout(event.data.object.id);
        }
        catch (err) {
            console.error("Error fulfilling checkout:", err);
        }
    }
    res.status(200).json({ received: true });
};
exports.handleWebhook = handleWebhook;
//# sourceMappingURL=payment.js.map
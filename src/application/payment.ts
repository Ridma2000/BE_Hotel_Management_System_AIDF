import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { getStripeClient, getStripePublishableKey } from "../infrastructure/stripe";
import Booking from "../infrastructure/entities/Booking";
import Hotel from "../infrastructure/entities/Hotel";
import UnauthorizedError from "../domain/errors/unauthorized-error";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";

const FRONTEND_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://localhost:8000";

export const createCheckoutSession = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { bookingId } = req.body;
  if (!bookingId) {
    throw new ValidationError("Booking ID is required");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (booking.userId !== userId) {
    throw new UnauthorizedError("Not authorized to pay for this booking");
  }

  if (booking.paymentStatus === "PAID") {
    throw new ValidationError("This booking has already been paid");
  }

  const hotel = await Hotel.findById(booking.hotelId);
  if (!hotel) {
    throw new NotFoundError("Hotel not found");
  }

  if (!hotel.stripePriceId) {
    throw new ValidationError("Stripe price ID is missing for this hotel. Please contact support.");
  }

  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const numberOfNights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  const stripe = await getStripeClient();

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

export const getSessionStatus = async (req: Request, res: Response) => {
  const { session_id } = req.query;
  if (!session_id || typeof session_id !== "string") {
    throw new ValidationError("Session ID is required");
  }

  const stripe = await getStripeClient();

  const session = await stripe.checkout.sessions.retrieve(session_id);
  const bookingId = session.metadata?.bookingId;

  if (!bookingId) {
    throw new NotFoundError("Booking not found in session");
  }

  const booking = await Booking.findById(bookingId).populate("hotelId");
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (session.payment_status === "paid" && booking.paymentStatus !== "PAID") {
    await Booking.findByIdAndUpdate(bookingId, { paymentStatus: "PAID" });
    booking.paymentStatus = "PAID";
  }

  res.json({
    status: session.status,
    paymentStatus: session.payment_status,
    booking: booking,
    customerEmail: session.customer_details?.email,
  });
};

export const getStripeConfig = async (req: Request, res: Response) => {
  const publishableKey = await getStripePublishableKey();
  res.json({ publishableKey });
};

async function fulfillCheckout(sessionId: string) {
  const stripe = await getStripeClient();

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  const bookingId = checkoutSession.metadata?.bookingId;
  if (!bookingId) {
    console.error("No bookingId in session metadata");
    return;
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    console.error("Booking not found:", bookingId);
    return;
  }

  if (booking.paymentStatus !== "PENDING") {
    console.log("Booking already processed:", bookingId);
    return;
  }

  if (checkoutSession.payment_status !== "unpaid") {
    await Booking.findByIdAndUpdate(bookingId, { paymentStatus: "PAID" });
    console.log("Booking marked as PAID:", bookingId);
  }
}

export const handleWebhook = async (req: Request, res: Response) => {
  const stripe = await getStripeClient();
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
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log("Received webhook event:", event.type);

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    try {
      await fulfillCheckout((event.data.object as any).id);
    } catch (err) {
      console.error("Error fulfilling checkout:", err);
    }
  }

  res.status(200).json({ received: true });
};

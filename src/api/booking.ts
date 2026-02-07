import { Router } from "express";
import { requireAuth } from "@clerk/express";
import {
  createBooking,
  getBookingById,
  getUserBookings,
  getAllBookings,
} from "../application/booking";

const bookingsRouter = Router();

bookingsRouter.get("/", requireAuth(), getUserBookings);
bookingsRouter.get("/all", getAllBookings);
bookingsRouter.post("/", requireAuth(), createBooking);
bookingsRouter.get("/:id", requireAuth(), getBookingById);

export default bookingsRouter;

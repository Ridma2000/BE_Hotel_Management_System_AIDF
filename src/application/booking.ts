import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import Booking from "../infrastructure/entities/Booking";
import Hotel from "../infrastructure/entities/Hotel";
import UnauthorizedError from "../domain/errors/unauthorized-error";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";

export const createBooking = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { hotelId, checkIn, checkOut } = req.body;

  if (!hotelId || !checkIn || !checkOut) {
    throw new ValidationError("Missing required fields: hotelId, checkIn, checkOut");
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkInDate >= checkOutDate) {
    throw new ValidationError("Check-out date must be after check-in date");
  }

  if (checkInDate < new Date()) {
    throw new ValidationError("Check-in date cannot be in the past");
  }

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new NotFoundError("Hotel not found");
  }

  const roomNumber = Math.floor(Math.random() * 500) + 100;

  const booking = await Booking.create({
    userId,
    hotelId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    roomNumber,
    paymentStatus: "PENDING",
  });

  res.status(201).json(booking);
};

export const getBookingById = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { id } = req.params;

  const booking = await Booking.findById(id).populate("hotelId");
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (booking.userId !== userId) {
    throw new UnauthorizedError("Not authorized to view this booking");
  }

  res.json(booking);
};

export const getUserBookings = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  const bookings = await Booking.find({ userId })
    .populate("hotelId")
    .sort({ createdAt: -1 });

  res.json(bookings);
};

export const getAllBookings = async (req: Request, res: Response) => {
  const bookings = await Booking.find()
    .populate("hotelId")
    .sort({ createdAt: -1 });

  res.json(bookings);
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBookings = exports.getUserBookings = exports.getBookingById = exports.createBooking = void 0;
const express_1 = require("@clerk/express");
const Booking_1 = __importDefault(require("../infrastructure/entities/Booking"));
const Hotel_1 = __importDefault(require("../infrastructure/entities/Hotel"));
const unauthorized_error_1 = __importDefault(require("../domain/errors/unauthorized-error"));
const not_found_error_1 = __importDefault(require("../domain/errors/not-found-error"));
const validation_error_1 = __importDefault(require("../domain/errors/validation-error"));
const createBooking = async (req, res) => {
    const { userId } = (0, express_1.getAuth)(req);
    if (!userId) {
        throw new unauthorized_error_1.default("Unauthorized");
    }
    const { hotelId, checkIn, checkOut } = req.body;
    if (!hotelId || !checkIn || !checkOut) {
        throw new validation_error_1.default("Missing required fields: hotelId, checkIn, checkOut");
    }
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkInDate >= checkOutDate) {
        throw new validation_error_1.default("Check-out date must be after check-in date");
    }
    if (checkInDate < new Date()) {
        throw new validation_error_1.default("Check-in date cannot be in the past");
    }
    const hotel = await Hotel_1.default.findById(hotelId);
    if (!hotel) {
        throw new not_found_error_1.default("Hotel not found");
    }
    const roomNumber = Math.floor(Math.random() * 500) + 100;
    const booking = await Booking_1.default.create({
        userId,
        hotelId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        roomNumber,
        paymentStatus: "PENDING",
    });
    res.status(201).json(booking);
};
exports.createBooking = createBooking;
const getBookingById = async (req, res) => {
    const { userId } = (0, express_1.getAuth)(req);
    if (!userId) {
        throw new unauthorized_error_1.default("Unauthorized");
    }
    const { id } = req.params;
    const booking = await Booking_1.default.findById(id).populate("hotelId");
    if (!booking) {
        throw new not_found_error_1.default("Booking not found");
    }
    if (booking.userId !== userId) {
        throw new unauthorized_error_1.default("Not authorized to view this booking");
    }
    res.json(booking);
};
exports.getBookingById = getBookingById;
const getUserBookings = async (req, res) => {
    const { userId } = (0, express_1.getAuth)(req);
    if (!userId) {
        throw new unauthorized_error_1.default("Unauthorized");
    }
    const bookings = await Booking_1.default.find({ userId })
        .populate("hotelId")
        .sort({ createdAt: -1 });
    res.json(bookings);
};
exports.getUserBookings = getUserBookings;
const getAllBookings = async (req, res) => {
    const bookings = await Booking_1.default.find()
        .populate("hotelId")
        .sort({ createdAt: -1 });
    res.json(bookings);
};
exports.getAllBookings = getAllBookings;
//# sourceMappingURL=booking.js.map
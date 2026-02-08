"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_2 = require("@clerk/express");
const booking_1 = require("../application/booking");
const bookingsRouter = (0, express_1.Router)();
bookingsRouter.get("/", (0, express_2.requireAuth)(), booking_1.getUserBookings);
bookingsRouter.get("/all", booking_1.getAllBookings);
bookingsRouter.post("/", (0, express_2.requireAuth)(), booking_1.createBooking);
bookingsRouter.get("/:id", (0, express_2.requireAuth)(), booking_1.getBookingById);
exports.default = bookingsRouter;
//# sourceMappingURL=booking.js.map
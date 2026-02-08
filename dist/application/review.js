"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviewsForHotel = exports.createReview = void 0;
const Review_1 = __importDefault(require("../infrastructure/entities/Review"));
const Hotel_1 = __importDefault(require("../infrastructure/entities/Hotel"));
const not_found_error_1 = __importDefault(require("../domain/errors/not-found-error"));
const validation_error_1 = __importDefault(require("../domain/errors/validation-error"));
const express_1 = require("@clerk/express");
const createReview = async (req, res, next) => {
    try {
        const reviewData = req.body;
        if (!reviewData.rating || !reviewData.comment || !reviewData.hotelId) {
            throw new validation_error_1.default("Rating, comment, and hotelId are required");
        }
        const { userId } = (0, express_1.getAuth)(req);
        const hotel = await Hotel_1.default.findById(reviewData.hotelId);
        if (!hotel) {
            throw new not_found_error_1.default("Hotel not found");
        }
        const review = await Review_1.default.create({
            rating: reviewData.rating,
            comment: reviewData.comment,
            userId: userId,
        });
        hotel.reviews.push(review._id);
        await hotel.save();
        res.status(201).send();
    }
    catch (error) {
        next(error);
    }
};
exports.createReview = createReview;
const getReviewsForHotel = async (req, res, next) => {
    try {
        const hotelId = req.params.hotelId;
        const hotel = await Hotel_1.default.findById(hotelId).populate("reviews");
        if (!hotel) {
            throw new not_found_error_1.default("Hotel not found");
        }
        res.status(200).json(hotel.reviews);
    }
    catch (error) {
        next(error);
    }
};
exports.getReviewsForHotel = getReviewsForHotel;
//# sourceMappingURL=review.js.map
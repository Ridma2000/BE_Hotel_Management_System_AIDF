"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_1 = require("../application/review");
const authentication_middleware_1 = __importDefault(require("./middleware/authentication-middleware"));
const reviewRouter = express_1.default.Router();
reviewRouter.route("/").post(authentication_middleware_1.default, review_1.createReview);
reviewRouter.route("/hotel/:hotelId").get(authentication_middleware_1.default, review_1.getReviewsForHotel); //! /api/reviews/hotel/:hotelId
exports.default = reviewRouter;
//# sourceMappingURL=review.js.map
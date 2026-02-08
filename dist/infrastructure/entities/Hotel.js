"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const hotelSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    reviews: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: "Review",
        default: [],
    },
    stripePriceId: {
        type: String,
        default: null,
    },
});
const Hotel = mongoose_1.default.model("Hotel", hotelSchema);
exports.default = Hotel;
//# sourceMappingURL=Hotel.js.map
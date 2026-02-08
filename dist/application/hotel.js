"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupStripePrice = exports.deleteHotel = exports.patchHotel = exports.updateHotel = exports.getHotelById = exports.createHotel = exports.getAllHotels = void 0;
const Hotel_1 = __importDefault(require("../infrastructure/entities/Hotel"));
const Location_1 = __importDefault(require("../infrastructure/entities/Location"));
const not_found_error_1 = __importDefault(require("../domain/errors/not-found-error"));
const validation_error_1 = __importDefault(require("../domain/errors/validation-error"));
const stripe_1 = require("../infrastructure/stripe");
const hotel_1 = require("../domain/dtos/hotel");
const getAllHotels = async (req, res, next) => {
    try {
        const hotels = await Hotel_1.default.find();
        res.status(200).json(hotels);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.getAllHotels = getAllHotels;
const createHotel = async (req, res, next) => {
    try {
        const hotelData = req.body;
        const result = hotel_1.CreateHotelDTO.safeParse(hotelData);
        if (!result.success) {
            throw new validation_error_1.default(`${result.error.message}`);
        }
        const stripe = await (0, stripe_1.getStripeClient)();
        const product = await stripe.products.create({
            name: result.data.name,
            description: result.data.description,
            default_price_data: {
                unit_amount: Math.round(result.data.price * 100),
                currency: "usd",
            },
        });
        const stripePriceId = typeof product.default_price === "string"
            ? product.default_price
            : product.default_price?.id;
        const newHotel = await Hotel_1.default.create({
            ...result.data,
            stripePriceId,
        });
        if (result.data.location) {
            const locationName = result.data.location.split(",")[0].trim();
            const escapedLocationName = locationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const existingLocation = await Location_1.default.findOne({
                name: { $regex: new RegExp(`^${escapedLocationName}$`, 'i') }
            });
            if (!existingLocation) {
                await Location_1.default.create({ name: locationName });
            }
        }
        res.status(201).json(newHotel);
    }
    catch (error) {
        next(error);
    }
};
exports.createHotel = createHotel;
const getHotelById = async (req, res, next) => {
    try {
        const _id = req.params._id;
        const hotel = await Hotel_1.default.findById(_id);
        if (!hotel) {
            throw new not_found_error_1.default("Hotel not found");
        }
        res.status(200).json(hotel);
    }
    catch (error) {
        next(error);
    }
};
exports.getHotelById = getHotelById;
const updateHotel = async (req, res, next) => {
    try {
        const _id = req.params._id;
        const hotelData = req.body;
        if (!hotelData.name ||
            !hotelData.image ||
            !hotelData.location ||
            !hotelData.price ||
            !hotelData.description) {
            throw new validation_error_1.default("Invalid hotel data");
        }
        const hotel = await Hotel_1.default.findById(_id);
        if (!hotel) {
            throw new not_found_error_1.default("Hotel not found");
        }
        await Hotel_1.default.findByIdAndUpdate(_id, hotelData);
        res.status(200).json(hotelData);
    }
    catch (error) {
        next(error);
    }
};
exports.updateHotel = updateHotel;
const patchHotel = async (req, res, next) => {
    try {
        const _id = req.params._id;
        const hotelData = req.body;
        if (!hotelData.price) {
            throw new validation_error_1.default("Price is required");
        }
        const hotel = await Hotel_1.default.findById(_id);
        if (!hotel) {
            throw new not_found_error_1.default("Hotel not found");
        }
        await Hotel_1.default.findByIdAndUpdate(_id, { price: hotelData.price });
        res.status(200).send();
    }
    catch (error) {
        next(error);
    }
};
exports.patchHotel = patchHotel;
const deleteHotel = async (req, res, next) => {
    try {
        const _id = req.params._id;
        const hotel = await Hotel_1.default.findById(_id);
        if (!hotel) {
            throw new not_found_error_1.default("Hotel not found");
        }
        await Hotel_1.default.findByIdAndDelete(_id);
        res.status(200).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteHotel = deleteHotel;
const setupStripePrice = async (req, res, next) => {
    try {
        const _id = req.params._id;
        const hotel = await Hotel_1.default.findById(_id);
        if (!hotel) {
            throw new not_found_error_1.default("Hotel not found");
        }
        const stripe = await (0, stripe_1.getStripeClient)();
        const product = await stripe.products.create({
            name: hotel.name,
            description: hotel.description,
            default_price_data: {
                unit_amount: Math.round(hotel.price * 100),
                currency: "usd",
            },
        });
        const stripePriceId = typeof product.default_price === "string"
            ? product.default_price
            : product.default_price?.id;
        await Hotel_1.default.findByIdAndUpdate(_id, { stripePriceId });
        res.status(200).json({ stripePriceId });
    }
    catch (error) {
        next(error);
    }
};
exports.setupStripePrice = setupStripePrice;
//# sourceMappingURL=hotel.js.map
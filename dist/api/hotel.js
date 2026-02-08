"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/hotel.ts
const express_1 = __importDefault(require("express"));
const hotel_1 = require("../application/hotel");
const authentication_middleware_1 = __importDefault(require("./middleware/authentication-middleware"));
const authorization_middleware_1 = __importDefault(require("./middleware/authorization-middleware"));
const ai_1 = require("../application/ai");
const hotelsRouter = express_1.default.Router();
hotelsRouter
    .route("/")
    .get(hotel_1.getAllHotels)
    .post(authentication_middleware_1.default, authorization_middleware_1.default, hotel_1.createHotel);
hotelsRouter.route("/ai").post(ai_1.respondToAIQuery);
hotelsRouter.route("/search").post(ai_1.searchHotelsWithAI);
hotelsRouter
    .route("/:_id")
    .get(hotel_1.getHotelById)
    .put(authentication_middleware_1.default, authorization_middleware_1.default, hotel_1.updateHotel)
    .patch(authentication_middleware_1.default, authorization_middleware_1.default, hotel_1.patchHotel)
    .delete(authentication_middleware_1.default, authorization_middleware_1.default, hotel_1.deleteHotel);
hotelsRouter.post("/:_id/stripe/price", authentication_middleware_1.default, authorization_middleware_1.default, hotel_1.setupStripePrice);
exports.default = hotelsRouter;
//# sourceMappingURL=hotel.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/location.ts
const express_1 = __importDefault(require("express"));
const location_1 = require("../application/location");
const authentication_middleware_1 = __importDefault(require("./middleware/authentication-middleware"));
const locationsRouter = express_1.default.Router();
locationsRouter
    .route("/")
    .get(location_1.getAllLocations) // public
    .post(authentication_middleware_1.default, location_1.createLocation); // protected (adjust if needed)
locationsRouter
    .route("/:_id")
    .get(location_1.getLocationById) // public
    .put(authentication_middleware_1.default, location_1.updateLocation) // protected
    .patch(authentication_middleware_1.default, location_1.patchLocation) // protected
    .delete(authentication_middleware_1.default, location_1.deleteLocation); // protected
exports.default = locationsRouter;
//# sourceMappingURL=location.js.map
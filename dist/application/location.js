"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocation = exports.patchLocation = exports.updateLocation = exports.getLocationById = exports.createLocation = exports.getAllLocations = void 0;
const Location_1 = __importDefault(require("../infrastructure/entities/Location"));
const not_found_error_1 = __importDefault(require("../domain/errors/not-found-error"));
const validation_error_1 = __importDefault(require("../domain/errors/validation-error"));
const getAllLocations = async (req, res, next) => {
    try {
        const locations = await Location_1.default.find();
        res.status(200).json(locations);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.getAllLocations = getAllLocations;
const createLocation = async (req, res, next) => {
    try {
        const locationData = req.body;
        if (!locationData.name) {
            throw new validation_error_1.default("Location name is required");
        }
        await Location_1.default.create(locationData);
        res.status(201).send();
    }
    catch (error) {
        next(error);
    }
};
exports.createLocation = createLocation;
const getLocationById = async (req, res, next) => {
    try {
        const _id = req.params._id;
        const location = await Location_1.default.findById(_id);
        if (!location) {
            throw new not_found_error_1.default("Location not found");
        }
        res.status(200).json(location);
    }
    catch (error) {
        next(error);
    }
};
exports.getLocationById = getLocationById;
const updateLocation = async (req, res, next) => {
    try {
        const _id = req.params._id;
        const locationData = req.body;
        if (!locationData.name) {
            throw new validation_error_1.default("Location name is required");
        }
        const location = await Location_1.default.findById(_id);
        if (!location) {
            throw new not_found_error_1.default("Location not found");
        }
        await Location_1.default.findByIdAndUpdate(_id, locationData);
        res.status(200).send();
    }
    catch (error) {
        next(error);
    }
};
exports.updateLocation = updateLocation;
const patchLocation = async (req, res, next) => {
    try {
        const _id = req.params._id;
        const locationData = req.body;
        if (!locationData.name) {
            throw new validation_error_1.default("Location name is required");
        }
        const location = await Location_1.default.findById(_id);
        if (!location) {
            throw new not_found_error_1.default("Location not found");
        }
        await Location_1.default.findByIdAndUpdate(_id, { name: locationData.name });
        res.status(200).send();
    }
    catch (error) {
        next(error);
    }
};
exports.patchLocation = patchLocation;
const deleteLocation = async (req, res, next) => {
    try {
        const _id = req.params._id;
        const location = await Location_1.default.findById(_id);
        if (!location) {
            throw new not_found_error_1.default("Location not found");
        }
        await Location_1.default.findByIdAndDelete(_id);
        res.status(200).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteLocation = deleteLocation;
//# sourceMappingURL=location.js.map
// src/api/location.ts
import express from "express";
import {
  getAllLocations,
  createLocation,
  getLocationById,
  updateLocation,
  patchLocation,
  deleteLocation,
} from "../application/location";
import isAuthenticated from "./middleware/authentication-middleware";

const locationsRouter = express.Router();

locationsRouter
  .route("/")
  .get(getAllLocations)                     // public
  .post(isAuthenticated, createLocation);   // protected (adjust if needed)

locationsRouter
  .route("/:_id")
  .get(getLocationById)                     // public
  .put(isAuthenticated, updateLocation)     // protected
  .patch(isAuthenticated, patchLocation)    // protected
  .delete(isAuthenticated, deleteLocation); // protected

export default locationsRouter;

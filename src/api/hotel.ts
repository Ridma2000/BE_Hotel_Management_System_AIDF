// src/api/hotel.ts
import express, { Request, Response, NextFunction } from "express";
import {
  getAllHotels,
  createHotel,
  getHotelById,
  updateHotel,
  patchHotel,
  deleteHotel,
  setupStripePrice,
} from "../application/hotel";
import isAuthenticated from "./middleware/authentication-middleware";
import isAdmin from "./middleware/authorization-middleware";
import { respondToAIQuery, searchHotelsWithAI } from "../application/ai";

const hotelsRouter = express.Router();

hotelsRouter
  .route("/")
  .get(getAllHotels)
  .post(isAuthenticated, isAdmin, createHotel);

hotelsRouter.route("/ai").post(respondToAIQuery);
hotelsRouter.route("/search").post(searchHotelsWithAI);

hotelsRouter
  .route("/:_id")
  .get(getHotelById)
  .put(isAuthenticated, isAdmin, updateHotel)
  .patch(isAuthenticated, isAdmin, patchHotel)
  .delete(isAuthenticated, isAdmin, deleteHotel);

hotelsRouter.post("/:_id/stripe/price", isAuthenticated, isAdmin, setupStripePrice);

export default hotelsRouter;

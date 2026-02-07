import Hotel from "../infrastructure/entities/Hotel";
import Location from "../infrastructure/entities/Location";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { getStripeClient } from "../infrastructure/stripe";

import { CreateHotelDTO } from "../domain/dtos/hotel";

import { Request, Response, NextFunction } from "express";

export const getAllHotels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotels = await Hotel.find();
    res.status(200).json(hotels);
    return;
  } catch (error) {
    next(error);
  }
};

export const createHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotelData = req.body;
    const result = CreateHotelDTO.safeParse(hotelData);

    if (!result.success) {
      throw new ValidationError(`${result.error.message}`);
    }

    const stripe = await getStripeClient();
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

    const newHotel = await Hotel.create({
      ...result.data,
      stripePriceId,
    });

    if (result.data.location) {
      const locationName = result.data.location.split(",")[0].trim();
      const escapedLocationName = locationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existingLocation = await Location.findOne({ 
        name: { $regex: new RegExp(`^${escapedLocationName}$`, 'i') } 
      });
      
      if (!existingLocation) {
        await Location.create({ name: locationName });
      }
    }
    
    res.status(201).json(newHotel);
  } catch (error) {
    next(error);
  }
};

export const getHotelById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _id = req.params._id;
    const hotel = await Hotel.findById(_id);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }
    res.status(200).json(hotel);
  } catch (error) {
    next(error);
  }
};

export const updateHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _id = req.params._id;
    const hotelData = req.body;
    if (
      !hotelData.name ||
      !hotelData.image ||
      !hotelData.location ||
      !hotelData.price ||
      !hotelData.description
    ) {
      throw new ValidationError("Invalid hotel data");
    }

    const hotel = await Hotel.findById(_id);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    await Hotel.findByIdAndUpdate(_id, hotelData);
    res.status(200).json(hotelData);
  } catch (error) {
    next(error);
  }
};

export const patchHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _id = req.params._id;
    const hotelData = req.body;
    if (!hotelData.price) {
      throw new ValidationError("Price is required");
    }
    const hotel = await Hotel.findById(_id);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }
    await Hotel.findByIdAndUpdate(_id, { price: hotelData.price });
    res.status(200).send();
  } catch (error) {
    next(error);
  }
};

export const deleteHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _id = req.params._id;
    const hotel = await Hotel.findById(_id);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }
    await Hotel.findByIdAndDelete(_id);
    res.status(200).send();
  } catch (error) {
    next(error);
  }
};

export const setupStripePrice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _id = req.params._id;
    const hotel = await Hotel.findById(_id);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    const stripe = await getStripeClient();
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

    await Hotel.findByIdAndUpdate(_id, { stripePriceId });
    
    res.status(200).json({ stripePriceId });
  } catch (error) {
    next(error);
  }
};

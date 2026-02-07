import "dotenv/config";
import connectDB from "../infrastructure/db";
import { getStripeClient } from "../infrastructure/stripe";
import Hotel from "../infrastructure/entities/Hotel";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const setupStripePrices = async () => {
  try {
    await connectDB();
    const stripe = await getStripeClient();

    const hotels = await Hotel.find({ stripePriceId: null });
    console.log(`Found ${hotels.length} hotels without Stripe prices`);

    if (hotels.length === 0) {
      console.log("All hotels already have Stripe prices configured.");
      process.exit(0);
    }

    for (const hotel of hotels) {
      console.log(`Creating Stripe product for ${hotel.name}...`);

      const product = await stripe.products.create({
        name: hotel.name,
        description: hotel.description,
        default_price_data: {
          unit_amount: Math.round(hotel.price * 100),
          currency: "usd",
        },
      });

      const stripePriceId =
        typeof product.default_price === "string"
          ? product.default_price
          : product.default_price?.id;

      await Hotel.findByIdAndUpdate(hotel._id, { stripePriceId });
      console.log(`Updated ${hotel.name} with Stripe price: ${stripePriceId}`);

      await delay(300);
    }

    console.log("All hotels now have Stripe prices configured!");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up Stripe prices:", error);
    process.exit(1);
  }
};

setupStripePrices();

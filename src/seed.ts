import "dotenv/config";
import connectDB from "./infrastructure/db";
import { getStripeClient } from "./infrastructure/stripe";

import Hotel from "./infrastructure/entities/Hotel";
import Location from "./infrastructure/entities/Location";

const hotels = [
  {
    name: "Montmartre Majesty Hotel",
    description:
      "Experience the charm of Montmartre with this luxurious hotel. Enjoy stunning views of the city and the Eiffel Tower from your room.",
    image:
      "https://cf.bstatic.com/xdata/images/hotel/max1280x900/297840629.jpg?k=d20e005d5404a7bea91cb5fe624842f72b27867139c5d65700ab7f69396026ce&o=&hp=1",
    location: "Paris, France",
    rating: 4.7,
    price: 160,
  },
  {
    name: "Loire Luxury Lodge",
    description:
      "Experience the beauty of the Loire Valley with this luxurious hotel. Enjoy stunning views of the vineyards and the Loire River from your room.",
    image:
      "https://cf.bstatic.com/xdata/images/hotel/max1280x900/596257607.jpg?k=0b513d8fca0734c02a83d558cbad7f792ef3ac900fd42c7d783f31ab94b4062c&o=&hp=1",
    location: "Sydney, Australia",
    rating: 4.7,
    price: 200,
  },
  {
    name: "Tokyo Tower Inn",
    description:
      "Experience the beauty of Tokyo with this luxurious hotel. Enjoy stunning views of the city and the Tokyo Tower from your room.",
    image:
      "https://cf.bstatic.com/xdata/images/hotel/max1280x900/308797093.jpg?k=3a35a30f15d40ced28afacf4b6ae81ea597a43c90c274194a08738f6e760b596&o=&hp=1",
    location: "Tokyo, Japan",
    rating: 4.4,
    price: 250,
  },
  {
    name: "Sydney Harbor Hotel",
    description:
      "Experience the beauty of Sydney with this luxurious hotel. Enjoy stunning views of the city and the Sydney Harbor from your room.",
    image:
      "https://cf.bstatic.com/xdata/images/hotel/max1280x900/84555265.jpg?k=ce7c3c699dc591b8fbac1a329b5f57247cfa4d13f809c718069f948a4df78b54&o=&hp=1",
    location: "Sydney, Australia",
    rating: 4.8,
    price: 300,
  },
];

const locations = [
  { name: "France" },
  { name: "Australia" },
  { name: "Japan" },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const seedDatabase = async () => {
  try {
    await connectDB();

    await Hotel.deleteMany({});
    await Location.deleteMany({});

    console.log("Cleared existing data");

    const createdLocations = await Location.insertMany(locations);
    console.log(`Created ${createdLocations.length} locations`);

    console.log("Creating hotels with Stripe products...");
    const stripe = await getStripeClient();

    const createdHotels = [];
    for (const hotelData of hotels) {
      console.log(`Creating Stripe product for ${hotelData.name}...`);

      const product = await stripe.products.create({
        name: hotelData.name,
        description: hotelData.description,
        default_price_data: {
          unit_amount: Math.round(hotelData.price * 100),
          currency: "usd",
        },
      });

      const stripePriceId =
        typeof product.default_price === "string"
          ? product.default_price
          : product.default_price?.id;

      const hotel = await Hotel.create({
        ...hotelData,
        stripePriceId,
      });

      createdHotels.push(hotel);
      console.log(`Created: ${hotel.name} with Stripe price: ${stripePriceId}`);

      await delay(300);
    }

    console.log(`Created ${createdHotels.length} hotels with Stripe prices`);

    console.log("\n=== SEED SUMMARY ===");
    console.log(`Locations: ${createdLocations.length}`);
    console.log(`Hotels: ${createdHotels.length}`);
    console.log("Database seeded successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();

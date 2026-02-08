"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const db_1 = __importDefault(require("../infrastructure/db"));
const stripe_1 = require("../infrastructure/stripe");
const Hotel_1 = __importDefault(require("../infrastructure/entities/Hotel"));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const setupStripePrices = async () => {
    try {
        await (0, db_1.default)();
        const stripe = await (0, stripe_1.getStripeClient)();
        const hotels = await Hotel_1.default.find({ stripePriceId: null });
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
            const stripePriceId = typeof product.default_price === "string"
                ? product.default_price
                : product.default_price?.id;
            await Hotel_1.default.findByIdAndUpdate(hotel._id, { stripePriceId });
            console.log(`Updated ${hotel.name} with Stripe price: ${stripePriceId}`);
            await delay(300);
        }
        console.log("All hotels now have Stripe prices configured!");
        process.exit(0);
    }
    catch (error) {
        console.error("Error setting up Stripe prices:", error);
        process.exit(1);
    }
};
setupStripePrices();
//# sourceMappingURL=setup-stripe-prices.js.map
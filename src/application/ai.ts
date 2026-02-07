import { Request, Response, NextFunction } from "express";

import { OpenAI } from "openai";
import Hotel from "../infrastructure/entities/Hotel";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const messages: { role: "user" | "assistant"; content: string }[] = [];

export const respondToAIQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query } = req.body;

    const hotelsData = await Hotel.find();

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions: `You are a helpful assistant that helps users to choose a hotel for a vibe they describe. the availble hotels are given below. Based on that recommend them a hotel along with the information: ${JSON.stringify(
        hotelsData
      )}`,
      input: query,
    });

    const aiResponse = response.output
      .filter((o) => o.type === "message")
      .map((el) => {
        return el.content
          .filter((c) => c.type === "output_text")
          .map((t) => t.text)
          .join("\n");
      })
      .join("\n");

    messages.push({
      role: "assistant",
      content: aiResponse,
    });

    console.log(messages);

    res.status(200).json({
      response: aiResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const searchHotelsWithAI = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query is required" });
    }

    const hotelsData = await Hotel.find();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a hotel recommendation assistant. Given a user's description of their ideal hotel or travel preferences, analyze the available hotels and return ONLY the IDs of hotels that match the criteria.

Available hotels:
${JSON.stringify(hotelsData.map(h => ({
  id: h._id.toString(),
  name: h.name,
  location: h.location,
  description: h.description,
  price: h.price,
  rating: h.rating
})), null, 2)}

Return a JSON object with a "matchingIds" array containing the MongoDB _id strings of matching hotels. If no hotels match, return an empty array.

Example response: {"matchingIds": ["id1", "id2"]}

Only return the JSON object, no additional text.`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const aiContent = response.choices[0]?.message?.content || '{"matchingIds": []}';
    
    let matchingIds: string[] = [];
    try {
      const parsed = JSON.parse(aiContent);
      matchingIds = parsed.matchingIds || [];
    } catch {
      console.error("Failed to parse AI response:", aiContent);
      matchingIds = [];
    }

    const matchingHotels = hotelsData.filter(hotel => 
      matchingIds.includes(hotel._id.toString())
    );

    if (matchingHotels.length === 0 && hotelsData.length > 0) {
      const lowerQuery = query.toLowerCase();
      const fallbackHotels = hotelsData.filter(hotel =>
        hotel.name.toLowerCase().includes(lowerQuery) ||
        hotel.location.toLowerCase().includes(lowerQuery) ||
        hotel.description?.toLowerCase().includes(lowerQuery)
      );
      
      return res.status(200).json({
        hotels: fallbackHotels,
        query,
        method: "fallback"
      });
    }

    res.status(200).json({
      hotels: matchingHotels,
      query,
      method: "ai"
    });
  } catch (error) {
    console.error("AI search error:", error);
    
    try {
      const hotelsData = await Hotel.find();
      const lowerQuery = req.body.query?.toLowerCase() || "";
      const fallbackHotels = hotelsData.filter(hotel =>
        hotel.name.toLowerCase().includes(lowerQuery) ||
        hotel.location.toLowerCase().includes(lowerQuery) ||
        hotel.description?.toLowerCase().includes(lowerQuery)
      );
      
      return res.status(200).json({
        hotels: fallbackHotels,
        query: req.body.query,
        method: "fallback"
      });
    } catch {
      next(error);
    }
  }
};

require("dotenv").config();
const mongoose = require("mongoose");
const fetch = require("node-fetch");

// Import your models
const Listing = require("./models/listing.js");
const ListingVector = require("./models/listings_vectors.js");

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

async function main() {
  await mongoose.connect(process.env.ATLASDB_URL);
  console.log("✅ Connected to MongoDB");
}

export async function getEmbedding(text) {
  const response = await fetch("https://router.huggingface.co/sambanova/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "E5-Mistral-7B-Instruct", // 🔹 required
      input: text, // must be `input`
    }),
  });

  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`HF API Error: ${JSON.stringify(data)}`);
  }

  return data.data[0].embedding; // Hugging Face router returns OpenAI-style JSON
}

async function addEmbeddings() {
  try {
    const listings = await Listing.find({});
    console.log(`📦 Found ${listings.length} listings`);

    for (const listing of listings) {
      const text = `${listing.title}: ${listing.description}`;

      console.log(`🔹 Embedding: ${listing.title}`);
      const vector = await getEmbedding(text);

      // Store in ListingVector collection
      await ListingVector.updateOne(
        { listingId: listing._id },
        { $set: { embedding: vector } },
        { upsert: true } // create if doesn’t exist
      );

      console.log(`✅ Stored embedding for: ${listing.title}`);
    }

    console.log("🎉 All embeddings stored in DB");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

main().then(addEmbeddings);

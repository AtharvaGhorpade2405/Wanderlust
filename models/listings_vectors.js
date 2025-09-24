const mongoose = require("mongoose");

const listingVectorSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  embedding: {
    type: [Number], 
    index: "vector", 
    dimensions: 1536, 
  },
});

module.exports = mongoose.model("listingVectorSchema", listingVectorSchema);

const Listing = require("../models/listing");
const listings_vectors = require("../models/listings_vectors");
const { getEmbedding } = require("../vectors");

module.exports.index = async (req, res) => {
  allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(`${id}`)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(`${id}`);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.filterListing = async (req, res) => {
  let { type } = req.params;
  let allListings = await Listing.find({ category: type });
  res.render("listings/filter.ejs", { allListings });
};

module.exports.searchListings = async (req, res) => {
  let query = req.query.q;
  if (!query || query.trim() === "") {
    res.redirect("/listings");
  } else {
    const allListings = await listings_vectors.aggregate([
    {
      $vectorSearch: {
        index: "vector_index", // name you gave to the index in Atlas
        path: "embedding",
        queryVector: getEmbedding(query), // function from vectors.js
        numCandidates: 100,
        limit: 5
      }
    }
  ]);
    if (allListings.length) res.render("listings/index.ejs", { allListings });
    else {
      req.flash("error", "No listings found!");
      res.redirect("/listings");
    }
  }
};

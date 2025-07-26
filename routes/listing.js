const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const ExpressError = require("../utils/expressError.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingControllers = require("../controllers/listings.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
    .route("/")
    .get(wrapAsync(listingControllers.index))
    .post(isLoggedIn, upload.single('listing[image]'), validateListing, wrapAsync(listingControllers.createListing));


//New Route
router.get("/new", isLoggedIn, listingControllers.renderNewForm);

router.route("/:id")
    .get(wrapAsync(listingControllers.showListing))
    .put(isLoggedIn, isOwner, upload.single('listing[image]'), validateListing, wrapAsync(listingControllers.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(listingControllers.destroyListing));

//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingControllers.renderEditForm));

//Filter Route
router.get("/filter/:type", wrapAsync(listingControllers.filterListing));


module.exports = router;

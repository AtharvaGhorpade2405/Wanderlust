if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const wrapAsync = require("./utils/wrapAsync.js");
const Listing = require("./models/listing.js");
const { listingSchema, reviewSchema } = require("./schema.js");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
var methodOverride = require('method-override');
app.use(methodOverride('_method'));
const ejsMate = require("ejs-mate");
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
const ExpressError = require("./utils/expressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");
const dbUrl = process.env.ATLASDB_URL;
const MongoStore = require("connect-mongo");

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
})

store.on("error", () => { console.log("ERROR in MONGO SESSION STORE", err) });

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000),
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};
async function main() {
    await mongoose.connect(dbUrl);
}

main().then((res) => { console.log("connected to db.") }).catch((err) => { console.log(err) });

app.listen(8080, () => {
    console.log("App is listening at port: 8080");
})

// app.get("/", (req, res) => {
//     res.send("Hi i am root.");
// })



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

// app.get("/demouser", async (req, res) => {
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student",
//     });

//     let regUser = await User.register(fakeUser, "helloworld");
//     res.send(regUser);
// })

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/listings/filter", listingRouter);

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found! "));
})

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { err });
})

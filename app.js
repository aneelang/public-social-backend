const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const { application } = require("express");
const HttpError = require("./models/http-error");

const app = express();

const url =
  "mongodb+srv://adithya:asdFer4C@cluster0.kucyx1b.mongodb.net/mern?retryWrites=true&w=majority";

app.use(bodyParser.json());

// Registering the routes as middleware

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/places", placesRoutes);

app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  return next(new HttpError("Could not find this path.", 404));
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "Unknown error occurred!" });
});

mongoose
  .connect(url)
  .then(() => {
    console.log("Connected to Database");
    app.listen(5001);
  })
  .catch((err) => {
    console.log(err);
  });

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not find a place", 500)
    );
  }
  if (!place) {
    return next(new HttpError("Could not find a place for the provided id", 404));
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithPlaces;
  try {
    userWithPlaces = await User.find().populate('places');
  } catch (err) {
    return next(new HttpError("Something when wrong, user not found!", 500));
  }
  if (!userWithPlaces || userWithPlaces.length === 0) {
    return next(
      new HttpError("Could not find the user with place for the provided id", 404)
    );
  }

  res.json({
    places: userWithPlaces.map((userWithPlace) => userWithPlace.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors);
    // throw new HttpError('Invalid inputs passed, please check your data', 422);
    // When working with async code new throw will not work. Use next()

    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description, address, creator } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image:
      "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/6cb64edd-2ecc-4a0f-9f34-e74c7109460b/dei7grk-99540925-2379-47d8-82c5-1f2061897edf.png/v1/fill/w_800,h_445,q_80,strp/mangrove__mangrove_cuckoo____pixel_dailies_by_rolitae_dei7grk-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NDQ1IiwicGF0aCI6IlwvZlwvNmNiNjRlZGQtMmVjYy00YTBmLTlmMzQtZTc0YzcxMDk0NjBiXC9kZWk3Z3JrLTk5NTQwOTI1LTIzNzktNDdkOC04MmM1LTFmMjA2MTg5N2VkZi5wbmciLCJ3aWR0aCI6Ijw9ODAwIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.Cvh_tn2JpSsatFfAhIeJCfrtLtf2ncEtaI4us4NX5uU",
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    return next(new HttpError("Create place failed, please try again", 500));
  }

  if (!user) {
    return next(new HttpError("Could not find user with this id", 404));
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }

  const { title, description} = req.body;
  const placeId = req.params.pid;

  let updatedPlace;
  try {
    updatedPlace = await Place.findById(placeId);
  } catch (err) {
    return new HttpError("Something went wrong, could not update place", 422);
  }

  updatedPlace.title = title;
  updatedPlace.description = description;

  try {
    await updatedPlace.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, unable to update place", 500)
    );
  }

  res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      "Somethign went wrong, cannot delete place",
      500
    );
    return next(error);
  }
  if(!place){
    return next(new HttpError('Could not find place.',404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({session: sess});
    place.creator.places.pull(place);
    await place.remove();
    await place.creator.save({session: sess});
    sess.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Something went wrong, delete place aborted!", 500)
    );
  }

  res.status(200).json({ message: "Deleted place" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
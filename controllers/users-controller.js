const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const mongoose = require('mongoose');

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    return next(
      new HttpError("Fetching users failed!, please try again later", 500)
    );
  }
  res
    .status(200)
    .json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs, please check your data", 422));
  }
  const { name, email, password} = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Could not create user, try again later.", 500));
  }

  if (existingUser) {
    return next(
      new HttpError("Could not create user, email already exists", 422)
    );
  }

  const createdUser = new User({
    name,
    email,
    image:
      "https://thumbs.dreamstime.com/b/flying-bird-pixel-pattern-art-vector-illustration-221779715.jpg",
    password,
    places:[],
  });

  try {
    await createdUser.save();
  } catch (err) {
    return next(
      new HttpError("Could not create user, please try again later.", 500)
    );
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const logIn = async (req, res, next) => {
  const { email, password } = req.body;

  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError("Could not find email, are you an existing user?")
    );
  }

  if (!identifiedUser || identifiedUser.password !== password) {
    return next(
      new HttpError(
        "Could not find user, credentials are wrong. Sign up if you don't have an account.",
        404
      )
    );
  }

  res.json({ message: "Logged in!", user: identifiedUser.toObject({getters:true})});
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.logIn = logIn;



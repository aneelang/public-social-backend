const express = require("express");

const HttpError = require("../models/http-error");
const usersController = require("../controllers/users-controller");
const { check } = require("express-validator");

const router = express.Router();

router.get("/", usersController.getUsers);

router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signUp
);

router.post("/login", usersController.logIn); // Bad practice to use a different path name and variable name for the same action. instead of login and sign in, maintain both as same names.

module.exports = router;

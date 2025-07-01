import { promisify } from "util";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import Patient from "../models/patientModel.js";
import Doctor from "../models/doctorModel.js";

/**
 * Middleware to protect routes by verifying the JWT token and setting `req.user`.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @throws {AppError} - Throws an error if token is missing, invalid, or user has changed password.
 */
export default asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt !== "loggedout") {
    token = req.cookies.jwt;
  }

  if (!token) {
    console.log("No token found - returning 401");
    return next(
      new AppError("You are not logged in. Please log in to access this.", 401)
    );
  }

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    let currentUser = await Patient.findById(decoded.id);
    if (!currentUser) {
      currentUser = await Doctor.findById(decoded.id);
    }

    if (!currentUser) {
      return next(
        new AppError("User to whom this token belongs no longer exists", 401)
      );
    }

    req.user = currentUser;
    req.user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.log(`Token expired at: ${err.expiredAt}`);
      return next(new AppError("Token expired, please log in again.", 401));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token format.", 401));
    }
    return next(new AppError("Invalid token.", 401));
  }
});

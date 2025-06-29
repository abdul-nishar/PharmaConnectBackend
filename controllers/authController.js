import { promisify } from "util";
import jwt from "jsonwebtoken";
import ms from "ms";
import Patient from "../models/patientModel.js";
import Doctor from "../models/doctorModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * Creates a JWT token for a given user ID.
 * @param {string} id - The user ID to include in the token payload.
 * @returns {string} - The signed JWT token.
 */
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_COOKIE_EXPIRY_TIME,
    });
};

/**
 * Creates and sends a JWT token as a cookie and user data in the response.
 * @param {Object} user - The user object to send in the response.
 * @param {number} statusCode - The HTTP status code for the response.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const createSendToken = (user, statusCode, req, res) => {
    // Create a token
    const token = signToken(user._id);

    // Convert cookie expiry time - JWT_COOKIE_EXPIRY_TIME is "2d", so calculate 2 days in milliseconds
    // Using ms library to handle "2d" format
    const expiresInMS = ms(process.env.JWT_COOKIE_EXPIRY_TIME) * 1000; // 2 days in milliseconds

    // Set cookie options
    const cookieOptions = {
        expires: new Date(Date.now() + expiresInMS),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    // Send the token as a cookie
    res.cookie("jwt", token, cookieOptions);

    // Hide user password from response
    user.password = undefined;

    // Send response with token and user data
    res.status(statusCode).json({
        status: "success",
        token,
        user,
    });
};

/**
 * Logs in a user by verifying their email and password, then creates and sends a JWT token.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @throws {AppError} - Throws an error if email or password is missing, or if authentication fails.
 */
export const login = catchAsync(async(req, res, next) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return next(new AppError("Please enter email and password", 400));
    }

    // Select the correct model based on role
    let model;
    if (role === "patient") {
        model = Patient;
    } else if (role === "doctor") {
        model = Doctor;
    } else {
        return next(new AppError("Invalid role specified", 400));
    }

    const user = await model.findOne({ email }).select("+password");

    if (!user || !(await user.passwordVerification(password, user.password))) {
        return next(new AppError("Invalid email or password", 401));
    }

    createSendToken(user, 200, req, res);
});

/**
 * Signs up a new user and sends a JWT token as a response.
 * @param {Object} req - The request object containing user data.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
export const signUp = catchAsync(async(req, res, next) => {
    const { role } = req.body;

    // Select the correct model based on role
    let model;
    if (role === "patient") {
        model = Patient;
    } else if (role === "doctor") {
        model = Doctor;
    } else {
        return next(new AppError("Invalid role specified", 400));
    }

    const newUser = await model.create(req.body);
    createSendToken(newUser, 201, req, res);
});

/**
 * Logs out a user by clearing the JWT token cookie.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const logout = (req, res) => {
    res.cookie("jwt", "loggedout", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.status(200).json({ status: "success" });
};

/**
 * Middleware to protect routes by verifying the JWT token and setting `req.user`.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @throws {AppError} - Throws an error if token is missing, invalid, or user has changed password.
 */
export const protect = catchAsync(async(req, res, next) => {
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

        // Try to find user in both Patient and Doctor models
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

/**
 * Middleware to restrict access to certain roles.
 * @param {...string} roles - The roles that are allowed to access the route.
 * @returns {Function} - Middleware function to restrict access based on roles.
 * @throws {AppError} - Throws an error if user does not have permission.
 */
export const restrictTo =
    (...roles) =>
    (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError("You do not have permission to perform this action.", 403)
            );
        }
        next();
    };
import express from "express";
import * as authController from "../controllers/authController.js";
import * as userController from "../controllers/userController.js";

const router = express.Router();

/**
 * Route to handle user authentication and management.
 * @module userRoutes
 */

/**
 * @route POST /api/users/login
 * @desc Log in a user
 * @access Public
 */
router.post("/login", authController.login);

/**
 * @route POST /api/users/signup
 * @desc Register a new user
 * @access Public
 */
router.post("/signup", authController.signUp);

/**
 * @route GET /api/users/logout
 * @desc Log out a user
 * @access Private
 */
router.get("/logout", authController.logout);

// Middleware to protect routes
router.use(authController.protect);

/**
 * @route GET /api/users/me
 * @desc Get current user's basic profile data
 * @access Private
 */
router.get("/me", userController.getMe);

/**
 * @route GET /api/users/profile
 * @desc Get current user's complete profile data with populated references
 * @access Private
 */
router.get("/profile", userController.getUserProfileData);

/**
 * @route PATCH /api/users/updateMe
 * @desc Update the current user's profile
 * @access Private
 */
router.patch("/updateMe", userController.updateMe);

export default router;

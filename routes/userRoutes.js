import express from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middlewares/protect.js';

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
router.post('/login', authController.login);

/**
 * @route POST /api/users/signup
 * @desc Register a new user
 * @access Public
 */
router.post('/signup', authController.signUp);

/**
 * @route GET /api/users/logout
 * @desc Log out a user
 * @access Private
 */
router.get('/logout', authController.logout);

// Middleware to protect routes
// router.use(protect);



export default router;
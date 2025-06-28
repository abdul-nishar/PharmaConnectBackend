import express from "express";
import { doctorController } from "../controllers/doctorController.js";
import { protect } from "../controllers/authController.js";

const router = express.Router();

router.use(protect);

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors with optional filtering and pagination
 * @access  Public
 */
router.get("/", doctorController.getAllDoctors);

/**
 * @route   GET /api/doctors/:id
 * @desc    Get a single doctor by ID
 * @access  Public
 */
router.get("/:id", doctorController.getDoctor);

/**
 * @route   GET /api/doctors/:id/availability
 * @desc    Get doctor's availability for a specific date
 * @access  Public
 */
router.get("/:id/availability", doctorController.getDoctorAvailability);

export default router;
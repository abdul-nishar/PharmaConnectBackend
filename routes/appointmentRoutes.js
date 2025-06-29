import express from "express";
import { appointmentController } from "../controllers/appointmentController.js";
import { protect } from "../controllers/authController.js";
const router = express.Router();

// Middleware to protect routes
router.use(protect);

/**
 * @route POST /api/appointments/
 * @desc creates an appointment
 * @access Private
 */
router.post("/", appointmentController.createAppointment);

/**
 * @route DELETE /api/appointments/:id
 * @desc Deletes an appointment by given id
 * @access Private
 */
router.delete("/:id", appointmentController.deleteAppointment);

/**
 * @route PUT /api/appointments/:id
 * @desc Updates an appointment by given id
 * @access Private
 */
router.patch("/:id", appointmentController.updateAppointment);

/**
 * @route GET /api/appointments/
 * @desc Gets all appointments of user (Patient or Doctor)
 * @access Private
 */
router.get("/", appointmentController.getAllAppointments);

/**
 * @route PATCH /api/appointments/:id/status
 * @desc Updates appointment status (for doctors to mark as completed and upload report)
 * @access Private
 */
router.patch("/:id/status", appointmentController.updateAppointmentStatus);

export default router;
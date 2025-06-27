import express from 'express'
import { appointmentController } from '../controllers/appointmentController.js'
import { protect } from '../middlewares/protect.js';

const router = express.Router();

// Middleware to protect routes
router.use(protect)

/**
 * @route POST /api/appointments/
 * @desc creates an appointment
 * @access Private
 */
router.post('/', appointmentController.createAppointment)

/**
 * @route DELETE /api/appointments/:id
 * @desc Deletes an appointment by given id
 * @access Private
 */
router.delete('/:id', appointmentController.deleteAppointment)

/**
 * @route PUT /api/appointments/:id
 * @desc Updates an appointment by given id
 * @access Private
 */
router.patch('/:id', appointmentController.updateAppointment)

/**
 * @route GET /api/appointments/
 * @desc Gets all appointments of user (Patient or Doctor)
 * @access Private
 */
router.get('/', appointmentController.getAllAppointments)

export default router;


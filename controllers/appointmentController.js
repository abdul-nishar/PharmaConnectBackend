import Appointment from "../models/appointmentModel.js";
import Doctor from "../models/doctorModel.js";
import Patient from "../models/patientModel.js";

// Create appointment
export const createAppointment = async(req, res) => {
    try {
        const { doctorId, appointmentDate, appointmentTime } = req.body;
        const patientId = req.user._id;

        // Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                status: "fail",
                message: "Doctor not found",
            });
        }

        // Check if slot is already booked
        const existingAppointment = await Appointment.findOne({
            doctorId,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            status: { $ne: "Cancelled" },
        });

        if (existingAppointment) {
            return res.status(400).json({
                status: "fail",
                message: "This time slot is already booked",
            });
        }

        const appointment = await Appointment.create({
            patientId,
            doctorId,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            consultationFee: doctor.consultationFee,
        });

        // Update patient and doctor appointment arrays
        await Patient.findByIdAndUpdate(patientId, {
            $push: { appointmentIds: appointment._id },
        });

        await Doctor.findByIdAndUpdate(doctorId, {
            $push: { appointmentIds: appointment._id },
        });

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate("doctorId", "name specialization location")
            .populate("patientId", "name email");

        res.status(201).json({
            status: "success",
            data: {
                appointment: populatedAppointment,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message,
        });
    }
};

// Get all appointments for user
export const getAllAppointments = async(req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const userId = req.user._id;
        const userRole = req.user.role;

        let query = {};

        if (userRole === "patient") {
            query.patientId = userId;
        } else if (userRole === "doctor") {
            query.doctorId = userId;
        }

        if (status && status !== "all") {
            query.status = status.charAt(0).toUpperCase() + status.slice(1);
        }

        const appointments = await Appointment.find(query)
            .populate("doctorId", "name specialization location consultationFee")
            .populate("patientId", "name email dateOfBirth")
            .sort({ appointmentDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Appointment.countDocuments(query);

        res.status(200).json({
            status: "success",
            results: appointments.length,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: {
                appointments,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message,
        });
    }
};

// Get single appointment
export const getAppointment = async(req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate("doctorId")
            .populate("patientId");

        if (!appointment) {
            return res.status(404).json({
                status: "fail",
                message: "Appointment not found",
            });
        }

        // Check if user has access to this appointment
        const userId = req.user._id;
        if (
            appointment.patientId._id.toString() !== userId ||
            appointment.doctorId._id.toString() !== userId
        ) {
            return res.status(403).json({
                status: "fail",
                message: "You do not have access to this appointment",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                appointment,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message,
        });
    }
};

// Update appointment
export const updateAppointment = async(req, res) => {
    try {
        const { appointmentDate, appointmentTime } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                status: "fail",
                message: "Appointment not found",
            });
        }

        // Check if user has permission to update
        if (appointment.patientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: "fail",
                message: "You can only update your own appointments",
            });
        }

        // Check if appointment can be updated (only pending appointments)
        if (appointment.status !== "Pending") {
            return res.status(400).json({
                status: "fail",
                message: "Only pending appointments can be updated",
            });
        }

        // If updating date/time, check availability
        if (appointmentDate || appointmentTime) {
            const existingAppointment = await Appointment.findOne({
                doctorId: appointment.doctorId,
                appointmentDate: new Date(
                    appointmentDate || appointment.appointmentDate
                ),
                appointmentTime: appointmentTime || appointment.appointmentTime,
                status: { $ne: "Cancelled" },
                _id: { $ne: appointment._id },
            });

            if (existingAppointment) {
                return res.status(400).json({
                    status: "fail",
                    message: "This time slot is already booked",
                });
            }
        }

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            req.params.id, {
                ...(appointmentDate && { appointmentDate: new Date(appointmentDate) }),
                ...(appointmentTime && { appointmentTime }),
            }, { new: true, runValidators: true }
        ).populate("doctorId", "name specialization location consultationFee");

        res.status(200).json({
            status: "success",
            data: {
                appointment: updatedAppointment,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message,
        });
    }
};

// Cancel/Delete appointment
export const deleteAppointment = async(req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                status: "fail",
                message: "Appointment not found",
            });
        }

        // Check permissions
        if (appointment.patientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: "fail",
                message: "You can only cancel your own appointments",
            });
        }

        // Update status to cancelled instead of deleting
        appointment.status = "Cancelled";
        await appointment.save();

        res.status(200).json({
            status: "success",
            message: "Appointment cancelled successfully",
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message,
        });
    }
};

// Update appointment status (for doctors)
export const updateAppointmentStatus = async(req, res) => {
    try {
        const { consultationReport } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                status: "fail",
                message: "Appointment not found",
            });
        }

        // Check if user is the doctor for this appointment
        if (appointment.doctorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: "fail",
                message: "You can only update your own appointments",
            });
        }

        appointment.status = "Completed";
        if (consultationReport) {
            appointment.consultationReport = consultationReport;
        }

        await appointment.save();

        res.status(200).json({
            status: "success",
            data: {
                appointment,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message,
        });
    }
};

export const appointmentController = {
    createAppointment,
    getAllAppointments,
    getAppointment,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus,
};
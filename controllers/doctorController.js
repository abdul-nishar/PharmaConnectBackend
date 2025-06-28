import Doctor from "../models/doctorModel.js";
import Appointment from "../models/appointmentModel.js";

// Get all doctors with filtering
export const getAllDoctors = async(req, res) => {
    try {
        const {
            specialization,
            location,
            maxFee,
            search,
            sortBy,
            page = 1,
            limit = 10,
        } = req.query;

        let query = {};

        // Apply filters
        if (specialization) {
            query.specialization = specialization;
        }

        if (location) {
            query.location = { $regex: location, $options: "i" };
        }

        if (maxFee) {
            query.consultationFee = { $lte: parseInt(maxFee) };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { specialization: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
            ];
        }

        // Sorting
        let sort = {};
        switch (sortBy) {
            case "fee":
                sort = { consultationFee: 1 };
                break;
            case "experience":
                sort = { experience: -1 };
                break;
            default:
                sort = { experience: -1 };
        }

        const doctors = await Doctor.find(query)
            .select("-password -passwordConfirm -appointmentIds")
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Doctor.countDocuments(query);

        res.status(200).json({
            status: "success",
            results: doctors.length,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: {
                doctors,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message,
        });
    }
};

// Get single doctor
export const getDoctor = async(req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).select(
            "-password -passwordConfirm"
        );

        if (!doctor) {
            return res.status(404).json({
                status: "fail",
                message: "User not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                doctor,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message,
        });
    }
};

// Get doctor availability
export const getDoctorAvailability = async(req, res) => {
    try {
        const { date } = req.query;
        const doctorId = req.params.id;

        if (!date) {
            return res.status(400).json({
                status: "fail",
                message: "Date is required",
            });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                status: "fail",
                message: "Doctor not found",
            });
        }

        // Get day of week
        const dayOfWeek = new Date(date).toLocaleLowerCase("en-US", {
            weekday: "long",
        });
        const availableSlots = doctor.availability[dayOfWeek] || [];

        // Get booked appointments for that date
        const bookedAppointments = await Appointment.find({
            doctorId,
            appointmentDate: new Date(date),
            status: { $ne: "Cancelled" },
        }).select("appointmentTime");

        const bookedTimes = bookedAppointments.map((apt) => apt.appointmentTime);
        const availableTimes = availableSlots.filter(
            (time) => !bookedTimes.includes(time)
        );

        res.status(200).json({
            status: "success",
            data: {
                availableSlots: availableTimes,
                totalSlots: availableSlots.length,
                bookedSlots: bookedTimes.length,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message,
        });
    }
};

export const doctorController = {
    getAllDoctors,
    getDoctor,
    getDoctorAvailability,
};
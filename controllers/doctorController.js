import Doctor from "../models/doctorModel.js";
import Appointment from "../models/appointmentModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";

// Get all doctors with filtering
export const getAllDoctors = asyncHandler(async(req, res, next) => {
    const {
        specialization,
        location,
        maxFee,
        search,
        sortBy,
        page = 1,
        limit = 100,
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

});

// Get single doctor
export const getDoctor = asyncHandler(async(req, res, next) => {
    console.log(req.params.id)
    const doctor = await Doctor.findById(req.params.id).select(
        "-password -passwordConfirm"
    );
    console.log(doctor)

    if (!doctor) {
        return next(new AppError("Doctor not found", 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            doctor,
        },
    });

});

// Get doctor availability
export const getDoctorAvailability = asyncHandler(async(req, res, next) => {
    const { date } = req.query;
    const doctorId = req.params.id;
    console.log(date)

    if (!date) {
        return next(new AppError("Date is required", 400))
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        return next(new AppError("Doctor not found", 404))
    }

    // Get day of week
    
    const dayOfWeek = new Date(date)
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

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
});

export const doctorController = {
    getAllDoctors,
    getDoctor,
    getDoctorAvailability,
};
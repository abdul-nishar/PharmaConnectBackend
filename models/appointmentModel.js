import mongoose from "mongoose";

const appointmentSchema = mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: [true, "Please provide patient Id"],
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: [true, "Please provide doctor Id"],
    },
    appointmentDate: {
        type: Date,
        required: [true, "Please select date of appointment"],
        validate: {
            validator: function(value) {
                return value > new Date(); // Ensure future date
            },
            message: "Appointment date must be in the future",
        },
    },
    appointmentTime: {
        type: String,
        required: [true, "Please select time of appointment"],
    },
    status: {
        type: String,
        default: "Pending",
    },
    consultationFee: {
        type: Number,
        required: [true, "Consultation fee is required"],
    },
    consultationReport: {
        name: {
            type: String,
        },
        age: Number,
        weight: Number,
        height: Number,
        comments: String,
        diagnosis: {
            type: String,
        },
        prescription: {
            type: String,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true, // Automatically manage createdAt and updatedAt
});

appointmentSchema.pre("save", async function(next) {
    if (this.isNew) {
        this.appointmentDate = new Date(this.appointmentDate);
    }
    next();
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
import mongoose from 'mongoose';

const appointmentSchema = mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Please provide patient Id'],
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Please provide doctor Id'],
    },
    appointmentDate: {
        type: Date,
        required: [true, "Please select date of appointment"],
    },
    status: {
        type: String,
        enum: ["Pending", "Completed", "Cancelled"],
        default: "Pending",
    },
    consultationReport: {
        name: {
            type: String,
            // required: [true, 'Patient name required']
        },
        age: Number,
        weight: Number,
        height: Number,
        comment: String,
        diagnosis: {
            type: String,
            // required: [true, 'Diagnosis is required'],
        },
        prescription: {
            type: String,
            // required: [true, 'Prescription is required'],
        }
    },
    createdAt: Date,
})

appointmentSchema.pre('save', async function (next) {
  this.appointmentDate = new Date(this.appointmentDate);
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema)

export default Appointment
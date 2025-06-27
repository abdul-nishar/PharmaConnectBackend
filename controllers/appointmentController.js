import Appointment from "../models/appointmentModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js"


/**
 * Creates an appointment based on the data received in req.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const createAppointment = catchAsync(async(req, res, next)=>{
    const appointment = await Appointment.create(req.body)
    res.status(201).json(appointment)
})


/**
 * deletes an appointment based on the id received in req.params.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @throws {AppError} if appointment does not exist
 */
const deleteAppointment = catchAsync(async(req, res, next)=>{
    const appointment = await Appointment.findByIdAndDelete(req.params.id)
    if(!appointment){
        return next(new AppError("Appointment not found", 404))
    }
    res.status(200).json({message: "Appointment deleted successfully"})
})


/**
 * updates an appointment based on the id and data received in req.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const updateAppointment = catchAsync(async(req,res, next)=>{
    const updatedAppointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {new:true})
    if(!updatedAppointment){
        return next(new AppError("Appointment not found", 404))
    }
    res.status(200).json(updatedAppointment)
})  


/**
 * Gets all appointments based on the user id and role received in req.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const getAllAppointments = catchAsync(async(req, res, next)=>{
    console.log(req.user)
    const appointments = req.user.role==='Patient'? await Appointment.find({patientId: req.user.id}) : await Appointment.find({doctorId: req.user.id})
    res.status(200).json(appointments)
})

export const appointmentController = {
    createAppointment,
    deleteAppointment,
    updateAppointment,
    getAllAppointments
}
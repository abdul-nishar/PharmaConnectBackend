import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Patient from "../models/patientModel.js";
import Doctor from "../models/doctorModel.js";

/**
 * Updates the currently logged-in user's profile with allowed fields.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @throws {AppError} If the request body contains password fields.
 */
export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updatePassword",
        401
      )
    );
  }

  let updatedUser;
  if (req.user.role === "patient") {
    // Update patient profile
    updatedUser = await Patient.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });
  } else if (req.user.role === "doctor") {
    // Update doctor profile
    updatedUser = await Doctor.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

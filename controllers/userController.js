import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Patient from "../models/patientModel.js";
import Doctor from "../models/doctorModel.js";

/**
 * Gets the current user's profile data.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
export const getUserProfileData = catchAsync(async (req, res, next) => {
  let user;
  
  if (req.user.role === "patient") {
    user = await Patient.findById(req.user.id)
      .populate('appointmentIds')
      .populate('chatIds')
      .populate('orderIds');
  } else if (req.user.role === "doctor") {
    user = await Doctor.findById(req.user.id)
      .populate('appointmentIds');
  }

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

/**
 * Gets the current user's basic profile data (without populated references).
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
export const getMe = catchAsync(async (req, res, next) => {
  let user;
  if (req.user.role === "patient") {
    user = await Patient.findById(req.user.id);
  } else if (req.user.role === "doctor") {
    user = await Doctor.findById(req.user.id);
  }

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Convert to plain object and remove sensitive/restricted fields
  let userObj = user.toObject();
  delete userObj.password;
  delete userObj.passwordConfirm;
  Object.keys(userObj).forEach(key => {
    if (key.endsWith('Ids')) delete userObj[key];
  });

  res.status(200).json({
    status: "success",
    data: {
      user: userObj,
    },
  });
});

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
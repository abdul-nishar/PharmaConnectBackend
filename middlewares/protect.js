import Patient from "../models/patientModel.js";
import Doctor from "../models/doctorModel.js";
import catchAsync from "../utils/catchAsync.js"
import AppError from "../utils/appError.js";

/**
 * Middleware to protect routes by verifying the JWT token and setting `req.user`.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @throws {AppError} - Throws an error if token is missing, invalid, or user has changed password.
 */
export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt && req.cookies.jwt !== 'loggedout') {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this.', 401));
  }
  console.log(token)
  try{

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Try to find user in both Patient and Doctor models
    let currentUser = await Patient.findById(decoded.id).select('-password');
    if (!currentUser) {
      currentUser = await Doctor.findById(decoded.id).select('-password');
    }
    
    if (!currentUser) {
      return next(new AppError('User to whom this token belongs no longer exists', 401));
    }

    req.user = currentUser;
    next();
  }catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.log(`Token expired at: ${err.expiredAt}`);
      return next(new AppError('Token expired, please log in again.', 401));
    }
    return next(new AppError('Invalid token.', 401));
  }
});
import AppError from "../utils/appError.js";
/**
 * Middleware to restrict access to certain roles.
 * @param {...string} roles - The roles that are allowed to access the route.
 * @returns {Function} - Middleware function to restrict access based on roles.
 * @throws {AppError} - Throws an error if user does not have permission.
 */
export const restrictTo =
    (...roles) =>
    (req, res, next) => {
        console.log(req.user.role);
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError("You do not have permission to perform this action.", 403)
            );
        }
        next();
    };
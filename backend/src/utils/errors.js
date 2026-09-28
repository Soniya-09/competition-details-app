class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const notFound = (what = 'Resource') => new AppError(404, 'NOT_FOUND', `${what} not found`);
const conflict = (code, message, details) => new AppError(409, code, message, details);
const badRequest = (message, details) => new AppError(400, 'VALIDATION_ERROR', message, details);
const unauthorized = (message = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', message);
const forbidden = (code, message) => new AppError(403, code, message);

module.exports = { AppError, notFound, conflict, badRequest, unauthorized, forbidden };

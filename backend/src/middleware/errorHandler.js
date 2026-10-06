const { errorResponse } = require('../utils/apiResponse');

function notFoundHandler(req, res) {
  res.status(404).json(
    errorResponse('NOT_FOUND', `Route not found: ${req.originalUrl}`),
  );
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error('[ERROR]', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'SERVER_ERROR';
  const message = err.publicMessage || err.message || 'Unexpected server error.';

  res.status(statusCode).json(
    errorResponse(code, message, process.env.NODE_ENV === 'development' ? err.stack : undefined),
  );
}

module.exports = { notFoundHandler, errorHandler };

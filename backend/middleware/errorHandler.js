const errorHandler = (err, req, res, next) => {
  // Log the error for debugging purposes. In a real production app, you might
  // send this to a logging service.
  console.error(err.stack);

  // Determine the status code. If the error has a status code, use it.
  // Otherwise, default to 500 (Internal Server Error).
  const statusCode = err.statusCode || 500;

  // Send a standardized JSON error response to the client.
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: err.message || 'Something went wrong on the server.',
  });
};

module.exports = errorHandler;

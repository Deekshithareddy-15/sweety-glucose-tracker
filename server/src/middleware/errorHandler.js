// Centralized Express error handler
const errorHandler = (err, req, res, next) => {
  // Log server errors for debugging (not leaked to client)
  if (process.env.NODE_ENV !== 'test') {
    console.error('API Error:', err);
  }

  // Handle PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'A record with this information already exists.',
    });
  }

  // Handle PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      error: 'The submitted data violated validation rules.',
    });
  }

  // Handle JSON parse errors from body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON payload.',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500
      ? 'An unexpected internal server error occurred. Please try again later.'
      : err.message || 'An error occurred processing your request.';

  return res.status(statusCode).json({
    error: message,
  });
};

module.exports = errorHandler;

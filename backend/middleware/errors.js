export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  if (error.name === 'CastError') return res.status(400).json({ message: 'A supplied identifier or value is invalid.' });
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(', ') });
  }
  if (error.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  const status = error.status || 500;
  res.status(status).json({ message: status === 500 ? 'Something went wrong. Please try again.' : error.message });
}

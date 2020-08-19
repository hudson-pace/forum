/* catches all errors and returns an error response. */

function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  } if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Unauthorized' });
  } if (err.name === 'NotFoundError') {
    return res.status(404).json({ message: err.message });
  }
  return res.status(500).json({ message: err.message });
}

module.exports = errorHandler;

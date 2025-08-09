// middleware/ipExtractor.js

const ipExtractor = (req, res, next) => {
  req.realIP =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  next();
};

module.exports = ipExtractor;

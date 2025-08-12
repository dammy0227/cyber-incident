// middleware/ipExtractor.js

function ipExtractor(req, res, next) {
  req.realIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;
  next();
}

module.exports = ipExtractor;

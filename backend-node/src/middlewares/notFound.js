const { failure } = require("../utils/apiResponse");

module.exports = function notFound(_req, res) {
  return failure(res, "Endpoint tidak ditemukan", 404);
};

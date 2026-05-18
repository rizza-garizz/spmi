const { ZodError } = require("zod");
const { failure } = require("../utils/apiResponse");

function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return failure(
      res,
      "Validasi gagal",
      422,
      error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }))
    );
  }

  if (error.name === "AppError") {
    return failure(res, error.message, error.statusCode, error.data);
  }

  return failure(
    res,
    error.message || "Internal server error",
    error.statusCode || 500
  );
}

module.exports = errorHandler;

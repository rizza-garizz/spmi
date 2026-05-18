module.exports = function parseJsonField(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    error.statusCode = 422;
    error.message = `Field ${fieldName} harus berupa JSON yang valid`;
    throw error;
  }
};

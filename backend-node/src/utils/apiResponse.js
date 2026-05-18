function success(res, data, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

function failure(res, message = "Terjadi kesalahan", statusCode = 500, data = null) {
  return res.status(statusCode).json({
    success: false,
    data,
    message,
  });
}

module.exports = {
  success,
  failure,
};

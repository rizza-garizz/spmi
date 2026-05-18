const { success } = require("../utils/apiResponse");

function health(_req, res) {
  return success(
    res,
    {
      status: "ok",
      service: "SPMI Command Center API",
    },
    "Layanan aktif"
  );
}

module.exports = {
  health,
};

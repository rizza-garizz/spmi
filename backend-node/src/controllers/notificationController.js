const { getNotifications } = require("../services/notificationService");
const { success } = require("../utils/apiResponse");

async function index(req, res) {
  const notifications = getNotifications(req.user, req.query || {});
  return success(
    res,
    {
      items: notifications,
      unread_count: notifications.filter((item) => !item.read).length,
      generated_at: new Date().toISOString(),
    },
    "Daftar notifikasi sistem"
  );
}

module.exports = {
  index,
};

const { failure } = require("../utils/apiResponse");
const env = require("../config/env");

const buckets = new Map();

function getClientKey(req, scope) {
  return `${scope}:${req.ip}:${req.user?.id || req.body?.email || "anonymous"}`;
}

function cleanup(now) {
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function createRateLimit({ windowMs, max, scope, message }) {
  return function rateLimit(req, res, next) {
    const now = Date.now();
    cleanup(now);

    const key = getClientKey(req, scope);
    const current = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (current.resetAt <= now) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    buckets.set(key, current);

    const remaining = Math.max(0, max - current.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));

    if (current.count > max) {
      return failure(res, message || "Terlalu banyak request. Coba lagi nanti.", 429, {
        retry_after_seconds: Math.ceil((current.resetAt - now) / 1000),
      });
    }

    return next();
  };
}

const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.authRateLimitMax,
  scope: "auth",
  message: "Percobaan login terlalu sering. Coba lagi beberapa menit.",
});

const mutationRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: env.mutationRateLimitMax,
  scope: "mutation",
});

module.exports = {
  createRateLimit,
  authRateLimit,
  mutationRateLimit,
};

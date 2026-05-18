function toPositiveNumber(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getPagination(query) {
  const page = toPositiveNumber(query.page, 1);
  const limit = Math.min(toPositiveNumber(query.limit, 10), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function buildMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil(total / limit)),
  };
}

module.exports = {
  getPagination,
  buildMeta,
};

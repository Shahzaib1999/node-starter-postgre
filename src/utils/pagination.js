exports.getPagination = (query, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(
    1,
    Math.min(parseInt(query.limit) || defaultLimit, maxLimit)
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

exports.paginateResult = ({ rows, count }, { page, limit }) => {
  return {
    items: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

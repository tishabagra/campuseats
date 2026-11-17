function problem(res, status, type, title, detail, errors = null) {
  res.set('Content-Type', 'application/problem+json; charset=utf-8');
  const body = {
    type,
    title,
    status,
    detail
  };
  if (errors && Array.isArray(errors) && errors.length > 0) {
    body.errors = errors;
  }
  return res.status(status).json(body);
}

module.exports = { problem };
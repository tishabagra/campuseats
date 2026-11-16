function problem(res, status, title, detail) {
  return res.status(status).json({
    type: `https://campuseats.example/problems/${status}`,
    title,
    status,
    detail
  });
}
module.exports = { problem };

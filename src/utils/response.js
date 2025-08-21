exports.generateResponse = (res, data, message = "", code = 200) => {
  return res.status(code).json({
    message,
    data,
  });
};

exports.generateError = (res, error, code = 400) => {
  return res.status(code).json({
    error,
    data: null,
  });
};

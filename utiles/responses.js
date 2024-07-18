exports.successResponse = (
  res,
  data = { data: {}, code: 200, message: "Successfull!" }
) => {
  return res.status(data.code ?? 200).json({
    data: data.data ?? {},
    message: data.message ?? "Successfull",
    success: true,
  });
};

exports.errorResponse = (
  res,
  data = { data: {}, code: 400, message: "UnSuccessfull!" }
) => {
  return res.status(data.code ?? 400).json({
    data: data.data ?? {},
    message: data.message ?? "UnSuccessfull",
    success: false,
  });
};

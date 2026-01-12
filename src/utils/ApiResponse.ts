export function ApiResponse(
  res: any,
  statusCode: number,
  message: string,
  data: any = null
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

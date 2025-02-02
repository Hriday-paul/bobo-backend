import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { otpServices } from './otp.service';
import sendResponse from '../../utils/sendResponse';
import { Request, Response } from 'express';
import { jwtDecode } from 'jwt-decode';
import AppError from '../../error/AppError';

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const token = req?.headers?.token;
  const result = await otpServices.verifyOtp(token as string, req.body.otp);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP verified successfully',
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const token = req?.headers?.token as string;
  const decoded = jwtDecode(token) as { email: string };

  if (!decoded?.email) {
    
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Token not found',
    );
  }

  const result = await otpServices.resendOtp(decoded?.email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP sent successfully',
    data: result,
  });
});

export const otpControllers = {
  verifyOtp,
  resendOtp,
};

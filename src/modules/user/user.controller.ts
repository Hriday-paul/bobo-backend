import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { uploadToS3 } from "../../utils/s3";
import { userService } from "./user.service";
import { IUser } from "./user.interface";
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'

const updateProfile = catchAsync(async (req: Request<{}, {}, IUser>, res: Response) => {
    let image;
    if (req.file) {
        image = await uploadToS3({
            file: req.file,
            fileName: `images/user/profile/${Math.floor(100000 + Math.random() * 900000)}`,
        });
    }

    const result = await userService.updateProfile(req.body, req.user._id, image || '')

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'profile updated successfully',
        data: result,
    });

})

//get my profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const result = await userService.getUserById(req?.user?._id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'profile fetched successfully',
        data: result,
    });
});


//add teacher
const addTeacher = catchAsync(async (req: Request, res: Response) => {
    const reqBody = { email: req?.body.email, name: req.body.firstName + req.body.lastName }
    const result = await userService.addTeacher(reqBody, req.user._id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'School Teacher created successfully',
        data: result,
    });
});

export const userController = {
    updateProfile,
    getMyProfile,
    addTeacher
}
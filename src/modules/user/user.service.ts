import AppError from "../../error/AppError";
import { IUser } from "./user.interface";
import { User } from "./user.models";
import httpStatus from 'http-status'

const updateProfile = async (payload: IUser, userId: string, image: string) => {
    const { contact, name, job_role, school } = payload

    const updateFields: Partial<IUser> = { contact, name, job_role, school };

    if (image) updateFields.image = image;

    // Remove undefined or null fields to prevent overwriting existing values with null
    Object.keys(updateFields).forEach((key) => {
        if (updateFields[key as keyof IUser] === undefined || updateFields[key as keyof IUser] === '' || updateFields[key as keyof IUser] === null) {
            delete updateFields[key as keyof IUser];
        }
    });

    if (Object.keys(updateFields).length === 0) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'No valid field found',
        );
    }

    const result = await User.updateOne({ _id: userId }, updateFields)

    return result

}


const getUserById = async (id: string) => {
    const result = await User.findById(id, { password: 0, verification: 0 });
    return result;
};


//adTeacher
const addTeacher = async (payload: {email : string, name : string}, userId: string) => {

    const isExist = await User.findOne({ email: payload?.email });

    //check teacher is exist or not
    if (isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Teacher has a another account',
        );
    }

    const user = await User.create({ email: payload.email, role: '4', school_admin: userId, name : payload.name });

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Teacher creation failed');
    }

    return user;

};


export const userService = {
    updateProfile,
    getUserById,
    addTeacher
}
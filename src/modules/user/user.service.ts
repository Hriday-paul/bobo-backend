import QueryBuilder from "../../builder/QueryBuilder";
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

//get all users
const allUsers = async (query: Record<string, any>) => {
    const userModel = new QueryBuilder(User.find({ role: { $ne: '5' } }), query)
        .search(['name', 'email', 'contact', 'school'])
        .filter()
        .paginate()
        .sort();
    const data: any = await userModel.modelQuery;
    const meta = await userModel.countTotal();
    return {
        data,
        meta,
    };
}


const getUserById = async (id: string) => {
    const result = await User.findById(id, { password: 0, verification: 0 });
    return result;
};


//adTeacher
const addTeacher = async (payload: { email: string, name: string }, userId: string) => {

    const isExist = await User.findOne({ email: payload?.email });

    //check teacher is exist or not
    if (isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Teacher has a another account',
        );
    }

    const user = await User.create({ email: payload.email, role: '4', school_admin: userId, name: payload.name });

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Teacher creation failed');
    }

    return user;
};

const mySchoolTeachers = async (query: Record<string, any>, userId: string) => {

    const userModel = new QueryBuilder(User.find({ role: "4", school_admin: userId }), query)
        .search(['name', 'email', 'contact', 'school'])
        .filter()
        .paginate()
        .sort();
    const data: any = await userModel.modelQuery;
    const meta = await userModel.countTotal();
    return {
        data,
        meta,
    };
    // return await User.find({ $or: [ { name: /sss/i } ] })
}

const deleteSchool_teacher = async (id: string, userId: string) => {
    const isExist = await User.findById(id);

    if (!isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Teacher not found',
        );
    }

    if ((!isExist?.school_admin.equals(userId)) && isExist.role !== '4') {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Teacher is not your school',
        );
    }

    const deleted = await User.deleteOne({ _id: id })

    return deleted

}

//user status update
const status_update_user = async (payload: { status: boolean }, id: string) => {

    const result = await User.updateOne({ _id: id }, { status: payload?.status })

    return result
}



export const userService = {
    updateProfile,
    getUserById,
    allUsers,
    addTeacher,
    deleteSchool_teacher,
    mySchoolTeachers,
    status_update_user
}
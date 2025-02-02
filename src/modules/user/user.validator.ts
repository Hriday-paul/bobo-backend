import { check } from "express-validator";

export const addSchoolTeacherValidator = [
    check('firstName').trim().escape().not().isEmpty().withMessage('firstName is required').isString().isLength({ min: 2 }).withMessage('firstName min length is 2'),
    check('lastName').trim().escape().not().isEmpty().withMessage('lastName is required').isString().isLength({ min: 2 }).withMessage('lastName min length is 2'),
    check('email').trim().escape().not().isEmpty().withMessage('Email is required').isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
]
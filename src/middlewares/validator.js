import { body } from "express-validator";
import { validarCampos } from "./validar-campos.js";
import { existenteEmail, esRoleValido } from "../helpers/db-validator.js";
import User from '../users/user.model.js'

export const studentRegisterValidator = [
    body("name", "The name is required").not().isEmpty(),
    body("email", "You must enter a valid email").not().isEmpty().isEmail(),
    body("email").custom(existenteEmail),
    body("password", "Password must be at least 8 characters").isLength({ min: 8 }),
    body("role").optional().default("STUDENT_ROLE"), 
    body("studentInfo.courses").optional().isArray().withMessage("Courses must be an array"),
    validarCampos
];

export const teacherRegisterValidator = [
    body("name", "The name is required").not().isEmpty(),
    body("email", "You must enter a valid email").not().isEmpty().isEmail(),
    body("email").custom(existenteEmail),
    body("password", "Password must be at least 8 characters").isLength({ min: 8 }),
    body("role").custom(esRoleValido), 
    body("teacherInfo.coursesCreated").optional().isArray().withMessage("Courses must be an array"),
    validarCampos
];

export const loginValidator = [
    body("email").optional().isEmail().withMessage("Enter a valid email address"),
    body("username")
        .if(body("email").not().exists())
        .notEmpty().withMessage("Username is required"),
    body("password", "Password must be at least 8 characters").isLength({ min: 8 }),
    validarCampos
];

export const alreadySigned = async (courseId, { req }) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        if (user.asignedCourses.includes(courseId)) {
            throw new Error("You are signed in this course already");
        }

        return true;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const duplicatedCourse = (courses) => {
    if (!Array.isArray(courses)) {
        throw new Error("Courses must be in array []");
    }

    const uniqueCourses = new Set(courses);
    if (uniqueCourses.size !== courses.length) {
        throw new Error("You cant be signed in the same course twice");
    }

    return true;
};

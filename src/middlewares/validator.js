import { body } from "express-validator";
import { validarCampos } from "./validar-campos.js";
import { existenteEmail, esRoleValido } from "../helpers/db-validator.js";


export const studentRegisterValidator = [
    body("name", "The name is required").not().isEmpty(),
    body("email", "You must enter a valid email").not().isEmpty().isEmail(),
    body("email").custom(existenteEmail),
    body("password", "Password must be at least 8 characters").isLength({ min: 8 }),
    body("phone", "Phone number must have 8 digits").isLength({ min: 8, max: 8 }),
    body("role").optional().default("STUDENT_ROLE"), 
    body("studentInfo.courses").optional().isArray().withMessage("Courses must be an array"),
    validarCampos
];

export const teacherRegisterValidator = [
    body("name", "The name is required").not().isEmpty(),
    body("email", "You must enter a valid email").not().isEmpty().isEmail(),
    body("email").custom(existenteEmail),
    body("password", "Password must be at least 8 characters").isLength({ min: 8 }),
    body("phone", "Phone number must have 8 digits").isLength({ min: 8, max: 8 }),
    body("role").custom(esRoleValido), 
    body("teacherInfo.coursesCreated").optional().isArray().withMessage("Courses must be an array"),
    validarCampos
];
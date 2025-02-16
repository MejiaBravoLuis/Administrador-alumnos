import e, { Router } from "express";
import { check } from "express-validator";
import { getCourses, updateCourse, addCourse, deleteCourse } from "../courses/course.controller.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { esObjectIdValido } from "../helpers/db-validator.js";
import { existeCourseByName } from "../helpers/db-validator.js";
import { existeUsuarioById } from "../helpers/db-validator.js";
import { tieneRole } from "../middlewares/validar-roles.js";
import { validarJWT } from "../middlewares/validar-jwt.js";

const router = Router();

router.get("/", getCourses)

router.post(
    "/",
    [
        check("courseName", "Course name is required").not().isEmpty(),
        check("courseName").custom(existeCourseByName), // 🔹 Verificar si el curso ya existe
        check("description", "Description is required").not().isEmpty(),
        check("assignedStudents")
            .optional()
            .isArray()
            .custom(async (students) => {
                for (let id of students) {
                    await esObjectIdValido(id);
                    await existeUsuarioById(id);
                }
                return true;
            }),
        check("teacher")
            .custom(async (id) => {
                await esObjectIdValido(id);
                await existeUsuarioById(id);
            }),
        validarCampos
    ],
    addCourse
);


export default router;
import { Router } from "express";
import { check, body } from "express-validator";
import { getCourses, updateCourse, addCourse, deleteCourse, signAlumnos } from "../courses/course.controller.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { esObjectIdValido } from "../helpers/db-validator.js";
import { existeCourseByName, existeCourseById } from "../helpers/db-validator.js";
import { existeUsuarioById } from "../helpers/db-validator.js";
import { tieneRole } from "../middlewares/validar-roles.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import {duplicatedCourse, alreadySignedInCourse} from "../middlewares/validator.js"

const router = Router();

router.get("/", getCourses)

router.post(
    "/",
    [
        validarJWT, 
        tieneRole("TEACHER_ROLE"),
        validarCampos
    ],
    addCourse
);

router.put(
    "/:id",
    [
        validarJWT, 
        tieneRole("TEACHER_ROLE"),
        check("id").custom(existeCourseById),
        validarCampos
    ],
    updateCourse
);

router.delete(
    "/:id",
    [
        validarJWT,  // Verifica que el usuario esté autenticado
        tieneRole("TEACHER_ROLE"),  // Asegura que solo los administradores puedan eliminar cursos
        check("id", "Invalid course ID").custom(existeCourseById),  // Valida que el curso exista
        validarCampos
    ],
    deleteCourse
);

router.put(
    "/inscribirse",
    [
        validarJWT, 
        tieneRole("STUDENT_ROLE"),
        body("assignedCourses") // Corregido el nombre
            .isArray().withMessage("Los cursos deben estar en un array")
            .custom((courses) => {
                if (courses.length > 3) {
                    throw new Error("Un estudiante solo puede registrarse en un máximo de 3 cursos");
                }
                return true;
            })
            .custom(alreadySignedInCourse),
        check("assignedCourses.*").custom(duplicatedCourse), // Corregido el nombre

        validarCampos
    ],
    signAlumnos
);

export default router;
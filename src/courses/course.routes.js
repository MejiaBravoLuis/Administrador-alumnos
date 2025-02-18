import { Router } from "express";
import { check, body } from "express-validator";
import { getCourses, updateCourse, addCourse, deleteCourse, signStudents } from "../courses/course.controller.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { existeCourseById } from "../helpers/db-validator.js";
import { tieneRole } from "../middlewares/validar-roles.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { alreadySigned, duplicatedCourse } from "../middlewares/validator.js"

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
    "/sign",
    [
        validarJWT,
        tieneRole("STUDENT_ROLE"),
        body("asignedCourses")
            .isArray().withMessage("Course's must be in array: []")
            .custom((courses) =>{
                if (courses.length > 3) {
                    throw new Error("The student only can be signed in 3 courses max")
                }
                return true;
            })
            .custom(duplicatedCourse),
        check("asignedCourses.*").custom(alreadySigned),
        validarCampos
    ],
    signStudents
)

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
        validarJWT, 
        tieneRole("TEACHER_ROLE"), 
        check("id").custom(existeCourseById),
        validarCampos
    ],
    deleteCourse
);

export default router;
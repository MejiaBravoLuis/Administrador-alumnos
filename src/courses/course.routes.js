import e, { Router } from "express";
import { check } from "express-validator";
import { getCourses, updateCourse, addCourse, deleteCourse } from "../courses/course.controller.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { esObjectIdValido } from "../helpers/db-validator.js";
import { existeCourseByName, existeCourseById } from "../helpers/db-validator.js";
import { existeUsuarioById } from "../helpers/db-validator.js";
import { tieneRole } from "../middlewares/validar-roles.js";
import { validarJWT } from "../middlewares/validar-jwt.js";

const router = Router();

router.get("/", getCourses)

router.post(
    "/",
    [
        check("courseName", "Course name is required").not().isEmpty(),
        check("courseName").custom(existeCourseByName),
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

router.put(
    "/:id",
    [
        validarJWT,  
        tieneRole("TEACHER_ROLE"),  
        check("id", "Invalid course ID").custom(async (id) => {
            await esObjectIdValido(id);
            const courseExists = await Course.findById(id);
            if (!courseExists) {
                throw new Error(`Course with ID '${id}' does not exist`);
            }
        }),
        check("courseName")
            .optional()
            .custom(async (courseName, { req }) => {
                const existingCourse = await Course.findOne({ courseName });
                if (existingCourse && existingCourse._id.toString() !== req.params.id) {
                    throw new Error(`The course name '${courseName}' is already in use`);
                }
            }),
        check("description")
            .optional()
            .notEmpty()
            .withMessage("Description cannot be empty"),
        check("assignedStudents")
            .optional()
            .isArray()
            .withMessage("Assigned students must be an array")
            .custom(async (students) => {
                for (let id of students) {
                    await esObjectIdValido(id);
                    await existeUsuarioById(id);
                }
                return true;
            }),
        check("teacher")
            .optional()
            .custom(async (id) => {
                await esObjectIdValido(id);
                const teacher = await User.findById(id);
                if (!teacher || teacher.role !== "TEACHER_ROLE") {
                    throw new Error("Teacher ID is invalid or the user is not a teacher");
                }
            }),
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



export default router;
import { Router } from "express";
import { login, registerStudent, registerTeacher } from "./auth.controller.js";
import { studentRegisterValidator, teacherRegisterValidator, loginValidator } from "../middlewares/validator.js";

const router = Router();

router.post(
    "/login",
    loginValidator,
    login
);

router.post(
    "/register/student",
    studentRegisterValidator,
    registerStudent
);

router.post(
    "/register/teacher",
    teacherRegisterValidator,
    registerTeacher
);

export default router;
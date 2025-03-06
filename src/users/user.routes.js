import { Router } from "express";
import { body, check } from "express-validator";
import { getUsers, updateUser, updatePassword, deleteUser } from "./user.controller.js";
import { existeUsuarioById } from "../helpers/db-validator.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { tieneRole } from "../middlewares/validar-roles.js";
import { validarJWT } from "../middlewares/validar-jwt.js";



const router = Router();

router.get("/", getUsers)

router.put(
    "/:id",
    [
        validarJWT,
        check("id", "This ID is not vaild").isMongoId(),
        check("id").custom(existeUsuarioById),
        validarCampos
    ],
    updateUser
)

router.put(
    "/:id/password",
    [
        validarJWT,
        check("id", "This ID is not vaild").isMongoId(),
        check("id").custom(existeUsuarioById),
        check("password", "New Password must be at least 8 characters").isLength({ min: 6 }),
        validarCampos
    ],
    updatePassword
);

router.delete(
    "/:id",
    [
        validarJWT,
        tieneRole("STUDENT_ROLE"),
        check("id", "Seems like this ID is not valid").isMongoId(),
        check("id").custom(existeUsuarioById),
        validarCampos
    ],
    deleteUser
)


export default router;
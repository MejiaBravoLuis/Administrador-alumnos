import jwt from "jsonwebtoken";
import User from "../users/user.model.js";

export const validarJWT = async (req, res, next) => {
    const token = req.header("x-token");

    if (!token) {
        return res.status(401).json({
            success: false,
            msg: "No token provided"
        });
    }

    try {
        const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);
        const user = await User.findById(uid);

        if (!user) {
            return res.status(401).json({
                success: false,
                msg: "Invalid token - user not found"
            });
        }

        req.user = user;
        next();

    } catch (error) {
        res.status(401).json({
            success: false,
            msg: "Invalid token"
        });
    }
};

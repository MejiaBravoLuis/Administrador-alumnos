import { response, request } from "express";
import { hash } from "argon2";
import User from "../users/user.model.js"
import Course from "../courses/course.model.js"

export const getUsers = async (req = request, res = response) => {
    try {
        const { limite = 10 , desde = 0 } = req.query;
        const query = { estado: true };

        const [total, users] = await Promise.all([
            User.countDocuments(),
            User.find()
                .skip(Number(desde))
                .limit(Number(limite))
        ]);
        

        res.status(200).json({
            success: true,
            total,
            users
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'Ups, something gone wrong getting the user, check the query and try again.',
            error
        })
    }
}

export const updateUser = async (req, res = response) => {
    try {
        const { id } = req.params;
        const authenticatedUserId = req.user._id; 

        if (id !== authenticatedUserId.toString()) {
            return res.status(403).json({
                success: false,
                msg: "You can only update your own account"
            });
        }

        const { _id, password, email, ...data } = req.body;

        if (password) {
            data.password = await hash(password);
        }

        const user = await User.findByIdAndUpdate(id, data, { new: true });

        res.status(200).json({
            success: true,
            msg: "User updated successfully!",
            user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Ups, something went wrong trying to update this user",
            error: error.message
        });
    }
};


export const updatePassword = async (req = request, res = response) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                msg: "Password must be at least 8 characters"
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "User not found"
            });
        }

        user.password = await hash(password);
        await user.save();

        res.status(200).json({
            success: true,
            msg: "Password updated succesfull!!",
            
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Ups, something went wrong updating your password",
            error
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedUserId = req.user._id;

        if (id !== authenticatedUserId.toString()) {
            return res.status(403).json({
                success: false,
                msg: "You can only deactivate your own account"
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "User not found"
            });
        }

        const courses = await Course.find({ students: id });

        await Promise.all(
            courses.map(course =>
                Course.findByIdAndUpdate(course._id, { $pull: { students: id } })
            )
        );

        user.status = false;
        user.asignedCourses = [];
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            msg: "User account deactivated and removed from courses successfully!",
            user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Ups, something went wrong trying to deactivate the user",
            error: error.message
        });
    }
};
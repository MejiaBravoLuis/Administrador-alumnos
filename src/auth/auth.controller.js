import User from '../users/user.model.js';
import Course from '../courses/course.model.js';
import { hash, verify } from 'argon2';
import { generarJWT } from '../helpers/generate-jwt.js'

export const registerStudent = async (req, res) => {
    try {
        const data = req.body;
        if (data.courses && data.courses.length > 3) {
            return res.status(400).json({
                message: "You can't be assigned more than 3 courses"
            });
        }

        const encryptedPassword = await hash(data.password);

        const user = await User.create({
            name: data.name,
            username: data.username,
            email: data.email,
            password: encryptedPassword,
            role: "STUDENT_ROLE"
        });

        if (data.courses && data.courses.length > 0) {
            const existingCourses = await User.findOne({ _id: user._id }, 'studentInfo.courses');
            
            const newCourses = data.courses.filter(course => 
                !existingCourses.studentInfo.courses.includes(course)
            );

            if (newCourses.length !== data.courses.length) {
                return res.status(400).json({
                    message: "You are in this courses already"
                });
            }

            const student = await User.findByIdAndUpdate(
                user._id,
                { $push: { "studentInfo.courses": { $each: newCourses } } },
                { new: true }
            );
        }

        return res.status(201).json({
            message: "Student registered succesfully!!",
            userDetails: {
                email: user.email,
                username: user.username
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Student register failed",
            error: error.message
        });
    }
};


export const registerTeacher = async (req, res) => {
    try {
        const data = req.body;

        if (!data.role || data.role !== "TEACHER_ROLE") {
            return res.status(400).json({ message: "Role must be TEACHER_ROLE" });
        }

        const encryptedPassword = await hash(data.password);

        const user = await User.create({
            name: data.name,
            username: data.username,
            email: data.email,
            password: encryptedPassword,
            role: data.role, 
        });

        if (data.course) {
            const course = await Course.create({
                title: data.course.title,
                description: data.course.description,
                teacher: user._id, 
            });

            await User.findByIdAndUpdate(user._id, {
                $push: { "teacherInfo.coursesCreated": course._id }
            });
        }

        return res.status(201).json({
            message: "Teacher registered succesfully!!!",
            userDetails: {
                email: user.email,
                username: user.username
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Teacher register failed",
            error: error.message
        });
    }
};

export const login = async (req, res) => {
    const { email, password, username } = req.body;

    try {
        const lowerEmail = email ? email.toLowerCase() : null;
        const lowerUsername = username ? username.toLowerCase() : null;

        const user = await User.findOne({
            $or: [{ email: lowerEmail }, { username: lowerUsername }]
        });

        if (!user) {
            return res.status(400).json({
                msg: 'Incorrect credentials, username does not exist in database '
            });
        }

        if (!user.status) {
            return res.status(400).json({
                msg: 'User does not exist in databse'
            });
        }

        const validPassword = await verify(user.password, password);
        if (!validPassword) {
            return res.status(400).json({
                msg: 'Incorrect password, try again'
            });
        }

        const token = await generarJWT(user.id);

        return res.status(200).json({
            msg: 'Login succesfully!!',
            userDetails: {
                username: user.username,
                token: token,
            }
        });

    } catch (e) {
        console.log(e);

        return res.status(500).json({
            message: "Server error",
            error: e.message
        });
    }
};
import { request, response } from "express";
import Course from "../courses/course.model.js";
import User from "../users/user.model.js";

export const addCourse = async (req = request, res = response) => {
    try {
        const { courseName, description, teacher, assignedStudents = [] } = req.body;

        const teacherExists = await User.findById(teacher);
        if (!teacherExists || teacherExists.role !== "TEACHER_ROLE") {
            return res.status(400).json({
                success: false,
                msg: "Invalid teacher ID or the user is not a teacher."
            });
        }

        const studentsExist = await User.find({ '_id': { $in: assignedStudents }, role: "STUDENT_ROLE" });

        if (studentsExist.length !== assignedStudents.length) {
            return res.status(400).json({
                success: false,
                msg: "One or more students do not exist or are not valid students."
            });
        }

        const newCourse = new Course({
            courseName,
            description,
            teacher,
            assignedStudents
        });

        await newCourse.save();

        res.status(201).json({
            success: true,
            msg: "Course created successfully!",
            course: newCourse
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Error creating the course",
            error: error.message
        });
    }
};

export const getCourses = async (req = request, res = response) => {
    try {
        const courses = await Course.find().populate("teacher", "name email");

        res.status(200).json({
            success: true,
            total: courses.length,
            courses
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Error fetching courses",
            error: error.message
        });
    }
};

export const updateCourse = async (req, res) => {
    try {
        console.log('si llegó el id bro', req.params.id)
        console.log('si llegaron los datos', req.body)
        const { id } = req.params;
        const teacherId = req.user._id; 

        const curso = await Course.findOne({ _id: id, teacher: teacherId });

        if (!curso) {
            return res.status(403).json({
                success: false,
                msg: "No puedes editar este curso",
            });
        }


        const cursoActualizado = await Course.findByIdAndUpdate(id, req.body, { new: true });

        res.json({
            success: true,
            msg: "Curso actualizado exitosamente",
            curso: cursoActualizado,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Error al actualizar el curso",
        });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user._id;

        console.log("Course ID:", id);
        console.log("Authenticated Teacher ID:", teacherId);

        const course = await Course.findOne({ _id: id, teacher: teacherId });

        if (!course) {
            return res.status(403).json({
                success: false,
                msg: "Couldn't delete this course"
            });
        }

        const students = await User.find({ asignedCourses: id });

        for( const student of students){
            let newAsignedCourses = [];
            for (let i = 0; i < student.asignedCourses.length; i++) {
                if (student.asignedCourses[i].toString() !== id) {
                    newAsignedCourses[newAsignedCourses.length] = student.asignedCourses[i]
                }                
            }

            await User.updateOne(
                { _id: student._id },
                { asignedCourses: newAsignedCourses },
                { runValidators: false }
            )
        }

        course.students = [];
        course.status = false;
        await course.save();

        res.status(200).json({
            success: true,
            message: "The course has been deactivated succesfully and the students are unsigned",
            course: course
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Ups, something went wrong trying to deactive the course",
            error: error.message
        })
    }
}

export const signStudents = async (req, res) => {
    try {
        const { asignedCourses } = req.body;
        const authenticatedUser = req.user;

        const user = await User.findById(authenticatedUser._id);

        const newCourses = await Course.find({
            _id: { $in: asignedCourses },
            status: true, 
            students: { $nin: [authenticatedUser._id] } 
        });

        if (newCourses.length === 0) {
            return res.status(400).json({
                success: false,
                message: "You are already signed in to these courses or they are inactive."
            });
        }

        if (user.asignedCourses.length + newCourses.length > 3) {
            return res.status(400).json({
                success: false,
                message: `Students can only be enrolled in up to 3 courses. You currently have ${user.asignedCourses.length} enrolled.`
            });
        }

        await Promise.all(
            newCourses.map(course =>
                Course.findByIdAndUpdate(course._id, { $push: { students: authenticatedUser._id } })
            )
        );

        await User.findByIdAndUpdate(authenticatedUser._id, {
            $push: { asignedCourses: { $each: newCourses.map(course => course._id) } }
        });

        res.status(200).json({
            success: true,
            message: "You've signed in to the selected courses successfully!",
            courses: newCourses
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong while signing in to courses",
            error: error.message
        });
    }
};

export const getStudentCourses = async (req, res) => {
    try {
        const authenticatedUser = req.user;

        const student = await User.findById(authenticatedUser._id)
            .populate({
                path: "asignedCourses",
                match: { status: true },
                select: "courseName description teacher"
            });

        res.status(200).json({
            success: true,
            msg: `${authenticatedUser.username} You're signed in the courses:`,
            total: student.asignedCourses.length,
            courses: student.asignedCourses
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong while getting your courses",
            error: error.message
        });
    }
};
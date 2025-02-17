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
        const { id } = req.params;
        const { courseName, description, assignedStudents, teacher } = req.body;

        // Verificar si el curso existe
        const existingCourse = await Course.findById(id);
        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                msg: `Course with ID '${id}' not found`
            });
        }

        // Validar que el profesor existe y tiene rol TEACHER_ROLE
        if (teacher) {
            const teacherData = await User.findById(teacher);
            if (!teacherData || teacherData.role !== "TEACHER_ROLE") {
                return res.status(400).json({
                    success: false,
                    msg: "Invalid teacher ID or user is not a teacher"
                });
            }
        }

        // Validar los estudiantes asignados
        if (assignedStudents) {
            for (let studentId of assignedStudents) {
                const studentExists = await User.findById(studentId);
                if (!studentExists) {
                    return res.status(400).json({
                        success: false,
                        msg: `Student ID '${studentId}' is invalid or does not exist`
                    });
                }
            }
        }

        // Actualizar curso
        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            { courseName, description, assignedStudents, teacher },
            { new: true, runValidators: true }
        ).populate("teacher").populate("assignedStudents");  // 🔥 Poblar datos

        res.json({
            success: true,
            msg: "Course updated successfully!",
            course: updatedCourse
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Something went wrong while updating the course",
            error: error.message
        });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        
        const course = await Course.findByIdAndUpdate(id, { status: false }, { new: true });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Course deactivated succesfully!!",
            course
        });
    } catch (error) {
        console.error("Something went wrong trying to delete the course:", error); 
        res.status(500).json({
            success: false,
            message: "Something went wrong trying to delete the course",
            error: error.message 
        });
    }
};



export const assignStudents = async (req = request, res = response) => {
    try {
        const { id } = req.params;
        const { students } = req.body; // [array de IDs de estudiantes]

        // Verificar si el curso existe
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                msg: "Course not found"
            });
        }

        // Verificar si los estudiantes existen
        const studentsExist = await User.find({ '_id': { $in: students }, role: "STUDENT_ROLE" });
        if (studentsExist.length !== students.length) {
            return res.status(400).json({
                success: false,
                msg: "One or more students do not exist or are not valid students"
            });
        }

        // Asignar estudiantes al curso
        course.assignedStudents.push(...students);
        await course.save();

        res.status(200).json({
            success: true,
            msg: "Students assigned to course successfully",
            course
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Error assigning students to the course",
            error: error.message
        });
    }
};

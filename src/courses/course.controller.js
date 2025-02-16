import { request, response } from "express";
import Course from "./course.model.js";
import User from "../users/user.model.js";

export const addCourse = async (req = request, res = response) => {
    try {
        const { courseName, description, teacher, assignedStudents = [] } = req.body;

        // Verificar si el profesor existe
        const teacherExists = await User.findById(teacher);
        if (!teacherExists || teacherExists.role !== "TEACHER_ROLE") {
            return res.status(400).json({
                success: false,
                msg: "Invalid teacher ID or the user is not a teacher."
            });
        }

        // Verificar si los estudiantes existen
        const studentsExist = await User.find({ '_id': { $in: assignedStudents }, role: "STUDENT_ROLE" });

        if (studentsExist.length !== assignedStudents.length) {
            return res.status(400).json({
                success: false,
                msg: "One or more students do not exist or are not valid students."
            });
        }

        // Crear el curso con los estudiantes asignados
        const newCourse = new Course({
            courseName,
            description,
            teacher,
            assignedStudents // ✅ Ahora se incluye en el objeto
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

export const updateCourse = async (req = request, res = response) => {
    try {
        const { id } = req.params;
        const { courseName, description, teacher } = req.body;

        // Verificar si el curso existe
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                msg: "Course not found"
            });
        }

        // Si se intenta cambiar el profesor, verificar que sea válido
        if (teacher) {
            const teacherExists = await User.findById(teacher);
            if (!teacherExists || teacherExists.role !== "TEACHER_ROLE") {
                return res.status(400).json({
                    success: false,
                    msg: "Invalid teacher ID or the user is not a teacher."
                });
            }
        }

        // Actualizar curso
        const updatedCourse = await Course.findByIdAndUpdate(id, { courseName, description, teacher }, { new: true });

        res.status(200).json({
            success: true,
            msg: "Course updated successfully!",
            course: updatedCourse
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Error updating the course",
            error: error.message
        });
    }
};

export const deleteCourse = async (req = request, res = response) => {
    try {
        const { id } = req.params;

        // Verificar si el curso existe
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                msg: "Course not found"
            });
        }

        await Course.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            msg: "Course deleted successfully!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Error deleting the course",
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

export const removeStudents = async (req = request, res = response) => {
    try {
        const { id } = req.params; // ID del curso
        const { studentId } = req.body; // ID del estudiante a eliminar

        // Verificar si el curso existe
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                msg: "Course not found"
            });
        }

        // Eliminar estudiante del curso
        course.assignedStudents = course.assignedStudents.filter(student => student.toString() !== studentId);
        await course.save();

        res.status(200).json({
            success: true,
            msg: "Student removed from course successfully",
            course
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Error removing student from the course",
            error: error.message
        });
    }
};

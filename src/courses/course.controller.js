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

export const signAlumnos = async (req, res) => {
    try {
        console.log('hola')
        const { assignedCourses } = req.body;
        const authenticatedUser = req.usuario; 

        if (authenticatedUser.role !== "STUDENT_ROLE") {
            return res.status(403).json({
                success: false,
                message: "Esta función solo es para estudiantes"
            });
        }

        if (!Array.isArray(assignedCourses) || assignedCourses.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Debes proporcionar un arreglo de IDs de cursos"
            });
        }

        const user = await User.findById(authenticatedUser._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const totalCursos = user.assignedCourses.length + assignedCourses.length;
        if (totalCursos > 3) {
            return res.status(400).json({
                success: false,
                message: "Un estudiante solo puede estar inscrito en un máximo de 3 cursos",
            });
        }


        const updatedCourses = await Promise.all(
            assignedCourses.map(async (courseId) => { 
                const curso = await Course.findById(courseId);

                if (!curso) return null;

                if (!curso.students.includes(authenticatedUser._id)) {
                    return Course.findByIdAndUpdate(
                        courseId,
                        { students: [...curso.students, authenticatedUser._id] },
                        { new: true }
                    );
                }

                return curso;
            })
        );

        await User.findByIdAndUpdate(authenticatedUser._id, {
            assignedCourses: [...user.assignedCourses, ...assignedCourses]
        });

        return res.status(200).json({
            success: true,
            msg: "Te has inscrito en los cursos seleccionados",
            courses: updatedCourses.filter(course => course !== null) 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error al inscribirte en los cursos",
            error
        });
    }
};
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

        if (authenticatedUser.role !== "STUDENT_ROLE") {
            return res.status(404).json({
                success: false,
                message: "Only students can sign in courses"
            });
        }

        if (!Array.isArray(asignedCourses) || asignedCourses.length === 0) {
            return res.status(400).json({
                succes: false,
                message: "Course's ID must be in array"
            });
        }

        const user = await User.findById(authenticatedUser._id);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "The student can be signed in 3 courses max"
            });
        }

        const updatedCourses = await Promise.all(
            asignedCourses.map(async (courseId) => {
                const course = await Course.findById(courseId);

                if (!course.students.includes(authenticatedUser._id)) {
                    return Course.findByIdAndUpdate(
                        courseId,
                        { students: [...course.students, authenticatedUser._id] },
                        { new: true }
                    );
                }
                return course;
            })
        );

        await User.findByIdAndUpdate(authenticatedUser._id, {
            asignedCourses: [ ...user.asignedCourses, ...asignedCourses ]
        });

        return res.status(200).json({
            success: true,
            msg: "You've signed in the selected courses",
            courses: updatedCourses.filter(course => course !== null)
        });

    } catch (error) {
        return res.status(500).json({
            success: true,
            message: "Ups, something went wrong trying to sign in the courses",
            error
        })
    }
}
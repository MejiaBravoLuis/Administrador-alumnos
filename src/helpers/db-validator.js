import User from '../users/user.model.js';
import Role from '../role/role.model.js';
import Course from '../courses/course.model.js'
import { Types } from "mongoose";

export const esRoleValido = async (role = ' ') => {
    const existeRol = await Role.findOne({ role });

    if(!existeRol){
        throw new Error(`El rol ${ role } no existe en la base de datos`);
    }
}

export const existenteEmail = async (correo = '') => {
    const existeEmail = await User.findOne({ correo });

    if(existeEmail){
        throw new Error(`El correo ${ correo } ya existe en la base de datos`);
    }
}

export const existeUsuarioById = async (id = '') => {
    const existeUsuario = await User.findById(id);

    if (!existeUsuario) {
        throw new Error(`El ID ${id} no existe`);
        
    }
}

export const existeCourseByName = async (courseName = "") => {
    const existingCourse = await Course.findOne({ courseName });

    if (existingCourse) {
        throw new Error(`The course '${courseName}' already exists in the database`);
    }
};

export const esObjectIdValido = async (id) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new Error(`The ID ${id} is not a valid ObjectId`);
    }
};

import { Schema, model } from "mongoose";

const UserSchema = new Schema({
        name: {
            type: String,
            required: [true, "Name is required"],
            maxLength: [25, "Cant be overcome 25 characters"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true
        },
        username: {
            type: String,
            unique: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minLength: 8
        },
        role: {
            type: String,
            enum: ["STUDENT_ROLE", "TEACHER_ROLE"],
            default: "STUDENT_ROLE"
        },
        studentInfo: {
            courses: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Course"
                }
            ]
        },
        teacherInfo: {
            coursesCreated: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Course"
                }
            ]
        },
        status: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

UserSchema.methods.toJSON = function () {
    const { __v, password, _id, ...user } = this.toObject();
    user.uid = _id;
    return user;
}

export default model ("User", UserSchema)
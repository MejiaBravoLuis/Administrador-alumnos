import { Schema, model } from "mongoose";

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            maxLength: [25, "Name cant exceed 25 characters"],
            trim: true
        },
        username: {
            type: String,
            unique: true,
            required: true,
            trim: true
        },
        email: {
            type: String,
            requied: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minLength: 8
        },
        role: {
            type: String,
            enum: ["TEACHER_ROLE", "STUDENT_ROLE"],
            default: "STUDENT_ROLE"
        },
        courses: [
            {
                type: Schema.Types.ObjectId,
                ref: "Course"
            },
        ],
        asignedCourses: [
            {
                type: Schema.Types.ObjectId,
                ref: "Course",
                validate: [
                    {
                        validator: function (val) {
                            return val.length <= 3;
                        },
                        message: "The student only can be sign in 3 courses max",
                    }
                ]
            }
        ],
        status: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

    UserSchema.methods.toJson = function (){
        const { _v, password, _id, ...user } = this.toObject();
        user.uid = _id;
        return user;
    }

    export default model("User", UserSchema)
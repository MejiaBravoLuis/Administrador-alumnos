import { Schema, model} from "mongoose";

const CourseSchema = new Schema({
    courseName: {
        type: String,
        required: [true, "Course's name is required"],
        maxLength: [25, "Course's name can't exceed 25 characters"]
    },
    description: {
        type: String,
        required: [true, "Add a description to the course"],
        maxLength: [100, "Description can't exceed 100 characters"]
    }, 
    status: {
        type: Boolean, 
        default: true
    },
    teacher: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Teacher is required"]
    },
    students: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        }
    ]
}, 
{
    timestamps: true,
    versionKey: false
});

export default model("Course", CourseSchema)
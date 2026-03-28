import mongoose, { Document, Schema, Types } from "mongoose"
import { IUser } from "../types/mongoose"

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
    default: "", // Default profile picture URL
  },
  bio: {
    type: String,
  },
  rooms: [{
    type: Schema.Types.ObjectId,
    ref: "Room",
  }],
  invites: [{
    type: Schema.Types.ObjectId,
    ref: "Room",
  }],
}, { timestamps: true })

const User = mongoose.model<IUser>("User", userSchema)

export default User

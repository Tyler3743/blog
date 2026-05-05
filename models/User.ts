import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = models.User || model("User", userSchema);

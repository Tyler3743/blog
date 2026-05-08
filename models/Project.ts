import { Schema, model, models, type InferSchemaType } from "mongoose";

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ name: 1 }, { unique: true });

export type ProjectDocument = InferSchemaType<typeof projectSchema>;
export const Project = models.Project || model("Project", projectSchema);

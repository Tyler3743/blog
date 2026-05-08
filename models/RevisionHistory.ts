import { Schema, model, models, type InferSchemaType } from "mongoose";

const revisionHistorySchema = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  action: {
    type: String,
    enum: ["posted", "updated"],
    default: "updated",
  },
  title: {
    type: String,
    default: "",
  },
  content: {
    type: String,
    default: "",
  },
  project: {
    type: String,
    default: "",
    trim: true,
  },
  oldTitle: {
    type: String,
    default: "",
  },
  newTitle: {
    type: String,
    default: "",
  },
  oldContent: {
    type: String,
    default: "",
  },
  newContent: {
    type: String,
    default: "",
  },
  changedFields: {
    type: [String],
    default: [],
  },
  editedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  editedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

revisionHistorySchema.index({ postId: 1, editedAt: -1 });
revisionHistorySchema.index({ editedAt: -1 });

export type RevisionHistoryDocument = InferSchemaType<typeof revisionHistorySchema>;
export const RevisionHistory =
  models.RevisionHistory || model("RevisionHistory", revisionHistorySchema);

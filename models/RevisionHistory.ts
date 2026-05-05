import { Schema, model, models, type InferSchemaType } from "mongoose";

const revisionHistorySchema = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  oldContent: {
    type: String,
    required: true,
  },
  newContent: {
    type: String,
    required: true,
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

export type RevisionHistoryDocument = InferSchemaType<typeof revisionHistorySchema>;
export const RevisionHistory =
  models.RevisionHistory || model("RevisionHistory", revisionHistorySchema);

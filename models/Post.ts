import { Schema, model, models, type InferSchemaType } from "mongoose";

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

postSchema.index({ publishedAt: -1, createdAt: -1 });

export type PostDocument = InferSchemaType<typeof postSchema>;
export const Post = models.Post || model("Post", postSchema);

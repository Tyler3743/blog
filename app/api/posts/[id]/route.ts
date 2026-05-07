import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { Post } from "@/models/Post";
import { RevisionHistory } from "@/models/RevisionHistory";
import "@/models/User";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  await connectMongo();

  const { id } = await context.params;
  const post = await Post.findById(id).populate("authorId", "email role").lean();

  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json(
      { message: "Bạn cần đăng nhập để sửa bài" },
      { status: 401 }
    );
  }

  await connectMongo();

  const { id } = await context.params;
  const body = await request.json();
  const post = await Post.findById(id);

  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }

  if (typeof body.content === "string" && body.content !== post.content) {
    await RevisionHistory.create({
      postId: post._id,
      oldContent: post.content,
      newContent: body.content,
      editedBy: authUser.userId,
    });
  }

  if (typeof body.title === "string") {
    post.title = body.title;
  }

  if (typeof body.content === "string") {
    post.content = body.content;
  }

  if ("publishedAt" in body) {
    post.publishedAt = body.publishedAt;
  }

  await post.save();

  return NextResponse.json({ post });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json(
      { message: "Bạn cần đăng nhập để xóa bài" },
      { status: 401 }
    );
  }

  await connectMongo();

  const { id } = await context.params;
  const post = await Post.findByIdAndDelete(id);

  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Post deleted" });
}

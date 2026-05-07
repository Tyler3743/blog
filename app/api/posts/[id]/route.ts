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
  const body = (await request.json()) as {
    title?: string;
    content?: string;
    publishedAt?: string | null;
  };
  const post = await Post.findById(id);

  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }

  const nextTitle = typeof body.title === "string" ? body.title.trim() : post.title;
  const nextContent = typeof body.content === "string" ? body.content.trim() : post.content;
  const changedFields: string[] = [];

  if (!nextTitle || !nextContent) {
    return NextResponse.json(
      { message: "Nhập đầy đủ tiêu đề và nội dung bài viết" },
      { status: 400 }
    );
  }

  if (nextTitle !== post.title) {
    changedFields.push("title");
  }

  if (nextContent !== post.content) {
    changedFields.push("content");
  }

  if (changedFields.length > 0) {
    await RevisionHistory.create({
      postId: post._id,
      oldTitle: post.title,
      newTitle: nextTitle,
      oldContent: post.content,
      newContent: nextContent,
      changedFields,
      editedBy: authUser.userId,
    });
  }

  post.title = nextTitle;
  post.content = nextContent;

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

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

  if (!post.authorId) {
    return NextResponse.json(
      { message: "Bài viết này chưa có chủ sở hữu" },
      { status: 403 }
    );
  }

  if (post.authorId.toString() !== authUser.userId) {
    return NextResponse.json(
      { message: "Bạn chỉ được sửa bài viết của chính mình" },
      { status: 403 }
    );
  }

  const nextTitle =
    typeof body.title === "string" ? body.title.trim() : post.title;

  const nextContent =
    typeof body.content === "string" ? body.content.trim() : post.content;

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
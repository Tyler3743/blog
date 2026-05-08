import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { Post } from "@/models/Post";
import { Project } from "@/models/Project";
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
      { message: "Ban can dang nhap de sua bai" },
      { status: 401 }
    );
  }

  await connectMongo();

  const { id } = await context.params;

  const body = (await request.json()) as {
    title?: string;
    content?: string;
    project?: string;
    publishedAt?: string | null;
  };

  const post = await Post.findById(id);

  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }

  if (!post.authorId) {
    return NextResponse.json(
      { message: "Bai viet nay chua co chu so huu" },
      { status: 403 }
    );
  }

  if (post.authorId.toString() !== authUser.userId) {
    return NextResponse.json(
      { message: "Ban chi duoc sua bai viet cua chinh minh" },
      { status: 403 }
    );
  }

  const nextTitle =
    typeof body.title === "string" ? body.title.trim() : post.title;
  const nextContent =
    typeof body.content === "string" ? body.content.trim() : post.content;
  const nextProject =
    typeof body.project === "string" ? body.project.trim() : post.project;

  if (!nextTitle || !nextContent || !nextProject) {
    return NextResponse.json(
      { message: "Nhap day du tieu de, noi dung va project bai viet" },
      { status: 400 }
    );
  }

  const changedFields: string[] = [];

  if (nextTitle !== post.title) {
    changedFields.push("title");
  }

  if (nextContent !== post.content) {
    changedFields.push("content");
  }

  if (nextProject !== post.project) {
    changedFields.push("project");
  }

  const projectDocument =
    nextProject !== post.project
      ? await Project.findOneAndUpdate(
          { name: nextProject },
          {
            $setOnInsert: {
              name: nextProject,
              createdBy: authUser.userId,
            },
          },
          { new: true, upsert: true }
        )
      : null;

  if (changedFields.length > 0) {
    await RevisionHistory.create({
      postId: post._id,
      action: "updated",
      title: nextTitle,
      content: nextContent,
      project: nextProject,
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
  post.project = nextProject;

  if (projectDocument) {
    post.projectId = projectDocument._id;
  }

  if ("publishedAt" in body) {
    post.publishedAt = body.publishedAt;
  }

  await post.save();

  return NextResponse.json({ post });
}

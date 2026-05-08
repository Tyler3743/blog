import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { Post } from "@/models/Post";
import { Project } from "@/models/Project";
import { RevisionHistory } from "@/models/RevisionHistory";
import "@/models/User";

export async function GET() {
  try {
    await connectMongo();

    const [posts, histories, projects] = await Promise.all([
      Post.find()
        .sort({ publishedAt: -1, createdAt: -1 })
        .populate("authorId", "email role")
        .lean(),
      RevisionHistory.find()
        .sort({ editedAt: -1 })
        .populate("editedBy", "email role")
        .lean(),
      Project.find().sort({ name: 1 }).lean(),
    ]);

    return NextResponse.json({ posts, histories, projects });
  } catch {
    return NextResponse.json(
      { message: "Không thể tải danh sách bài viết" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { message: "Bạn cần đăng nhập để đăng bài" },
        { status: 401 }
      );
    }

    await connectMongo();

    const { title, content, project, publishedAt } = (await request.json()) as {
      title?: string;
      content?: string;
      project?: string;
      publishedAt?: string | null;
    };

    const trimmedProject = project?.trim();

    if (!title?.trim() || !content?.trim() || !trimmedProject) {
      return NextResponse.json(
        { message: "Nhập đầy đủ tiêu đề và nội dung và project bài viết" },
        { status: 400 }
      );
    }

    const parsedPublishedAt = publishedAt ? new Date(publishedAt) : null;
    if (parsedPublishedAt && Number.isNaN(parsedPublishedAt.getTime())) {
      return NextResponse.json(
        { message: "Ngày đăng không hợp lệ" },
        { status: 400 }
      );
    }

    const projectDocument = await Project.findOneAndUpdate(
      { name: trimmedProject },
      {
        $setOnInsert: {
          name: trimmedProject,
          createdBy: authUser.userId,
        },
      },
      { new: true, upsert: true }
    );

    const post = await Post.create({
      title: title.trim(),
      content: content.trim(),
      project: projectDocument.name,
      projectId: projectDocument._id,
      authorId: authUser.userId,
      publishedAt: parsedPublishedAt,
    });

    await RevisionHistory.create({
      postId: post._id,
      action: "posted",
      title: post.title,
      content: post.content,
      project: post.project,
      oldTitle: "",
      newTitle: post.title,
      oldContent: "",
      newContent: post.content,
      changedFields: ["post"],
      editedBy: authUser.userId,
      editedAt: post.publishedAt || post.createdAt,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Không thể đăng bài" },
      { status: 500 }
    );
  }
}

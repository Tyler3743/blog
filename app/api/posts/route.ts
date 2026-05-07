import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { Post } from "@/models/Post";

export async function GET() {
  try {
    await connectMongo();

    const posts = await Post.find()
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate("authorId", "email role")
      .lean();

    return NextResponse.json({ posts });
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

    const { title, content, publishedAt } = (await request.json()) as {
      title?: string;
      content?: string;
      publishedAt?: string | null;
    };

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { message: "Nhập đầy đủ tiêu đề và nội dung bài viết" },
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

    const post = await Post.create({
      title: title.trim(),
      content: content.trim(),
      authorId: authUser.userId,
      publishedAt: parsedPublishedAt,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Không thể đăng bài" },
      { status: 500 }
    );
  }
}

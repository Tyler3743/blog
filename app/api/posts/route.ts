import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Post } from "@/models/Post";

export async function GET() {
  await connectMongo();

  const posts = await Post.find()
    .sort({ publishedAt: -1, createdAt: -1 })
    .populate("authorId", "email role")
    .lean();

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  await connectMongo();

  const body = await request.json();
  const post = await Post.create({
    title: body.title,
    content: body.content,
    authorId: body.authorId,
    publishedAt: body.publishedAt ?? null,
  });

  return NextResponse.json({ post }, { status: 201 });
}

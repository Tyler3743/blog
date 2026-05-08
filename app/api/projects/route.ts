import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { Project } from "@/models/Project";
import "@/models/User";

export async function GET() {
  try {
    await connectMongo();

    const projects = await Project.find().sort({ name: 1 }).lean();

    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json(
      { message: "Could not load projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { message: "You need to log in to add a project" },
        { status: 401 }
      );
    }

    await connectMongo();

    const { name } = (await request.json()) as {
      name?: string;
    };

    const trimmedName = name?.trim();
    if (!trimmedName) {
      return NextResponse.json(
        { message: "Please enter a project name" },
        { status: 400 }
      );
    }

    const project = await Project.findOneAndUpdate(
      { name: trimmedName },
      {
        $setOnInsert: {
          name: trimmedName,
          createdBy: authUser.userId,
        },
      },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Could not add project" },
      { status: 500 }
    );
  }
}

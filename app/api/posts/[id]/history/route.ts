import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { RevisionHistory } from "@/models/RevisionHistory";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  await connectMongo();

  const { id } = await context.params;
  const history = await RevisionHistory.find({ postId: id })
    .sort({ editedAt: -1 })
    .populate("editedBy", "email role")
    .lean();

  return NextResponse.json({ history });
}

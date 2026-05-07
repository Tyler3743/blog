import { connectMongo } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { Post } from "@/models/Post";
import { RevisionHistory } from "@/models/RevisionHistory";
import "@/models/User";
import { AuthAction } from "@/components/AuthAction";
import { BlogFeed, type FeedPost, type FeedRevision } from "@/components/BlogFeed";
import { PostComposer } from "@/components/PostComposer";

export const dynamic = "force-dynamic";

async function getOptionalUser() {
  try {
    return await getAuthUser();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  await connectMongo();

  const [authUser, posts, histories] = await Promise.all([
    getOptionalUser(),
    Post.find()
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate("authorId", "email")
      .lean(),
    RevisionHistory.find()
      .sort({ editedAt: -1 })
      .populate("editedBy", "email")
      .lean(),
  ]);

  const isAdmin = authUser?.role === "admin";
  const serialized = JSON.parse(JSON.stringify({ posts, histories })) as {
    posts: FeedPost[];
    histories: FeedRevision[];
  };

  return (
    <main className="site-shell">
      <header className="site-header">
        <h1>My Minimalist Blog</h1>
        <nav>
          <span aria-hidden="true" />
          <div className="nav-links">
            <a href="/">Home</a>
            <a href="/">About me</a>
            <a href="/">Why I write</a>
          </div>
          <div className="nav-actions">
            {isAdmin && <span className="admin-label">Admin: {authUser.email}</span>}
            <AuthAction isAdmin={isAdmin} />
          </div>
        </nav>
      </header>

      {isAdmin && <PostComposer />}

      <BlogFeed
        initialPosts={serialized.posts}
        initialHistories={serialized.histories}
        isAdmin={isAdmin}
      />
    </main>
  );
}

import Link from "next/link";
import { connectMongo } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { Post } from "@/models/Post";
import "@/models/User";
import { PostComposer } from "@/components/PostComposer";

export const dynamic = "force-dynamic";

type LeanPost = {
  _id: unknown;
  title: string;
  content: string;
  publishedAt?: Date | string | null;
  createdAt?: Date | string;
};

function formatDate(value?: Date | string | null) {
  if (!value) {
    return "Draft";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

async function getOptionalUser() {
  try {
    return await getAuthUser();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  await connectMongo();

  const [authUser, posts] = await Promise.all([
    getOptionalUser(),
    Post.find()
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate("authorId", "email")
      .lean<LeanPost[]>(),
  ]);

  const isAdmin = authUser?.role === "admin";
  const featuredPost = posts[0];
  const archivePosts = posts.slice(1);

  return (
    <main className="site-shell">
      <header className="site-header">
        <h1>My Minimalist Blog</h1>
        <nav>
          <Link href="/">Home</Link>
          {isAdmin ? <span>Admin: {authUser.email}</span> : <Link href="/login">Admin Login</Link>}
        </nav>
      </header>

      {isAdmin && <PostComposer />}

      {featuredPost ? (
        <>
          <section className="content-layout">
            <article className="featured-post" id={`post-${String(featuredPost._id)}`}>
              <h2>{featuredPost.title}</h2>
              <div className="post-meta">
                <time>{formatDate(featuredPost.publishedAt || featuredPost.createdAt)}</time>
              </div>
              <p>{featuredPost.content}</p>
            </article>

            <aside className="post-list">
              <h2>Latest</h2>
              <ul>
                {posts.map((post) => (
                  <li key={String(post._id)}>
                    <a href={`#post-${String(post._id)}`}>{post.title}</a>
                    <time>{formatDate(post.publishedAt || post.createdAt)}</time>
                  </li>
                ))}
              </ul>
            </aside>
          </section>

          {archivePosts.length > 0 && (
            <section className="archive">
              {archivePosts.map((post) => (
                <article id={`post-${String(post._id)}`} key={String(post._id)}>
                  <h2>{post.title}</h2>
                  <time>{formatDate(post.publishedAt || post.createdAt)}</time>
                  <p>{post.content}</p>
                </article>
              ))}
            </section>
          )}
        </>
      ) : (
        <section className="empty-state">
          <h2>No posts yet</h2>
          <p>{isAdmin ? "Publish the first post above." : "Please check back later."}</p>
        </section>
      )}
    </main>
  );
}

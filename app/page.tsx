import { connectMongo } from "@/lib/mongodb";
import { Post } from "@/models/Post";

type BlogPost = {
  _id: string;
  title: string;
  content: string;
  createdAt: Date;
  publishedAt?: Date;
};

const fallbackPosts: BlogPost[] = [
  {
    _id: "demo-1",
    title: "How I Start My Day",
    content:
      "Một bài viết tối giản có nội dung rõ ràng, khoảng trắng thoáng và nhịp đọc nhẹ nhàng. Đây là phần body của bài viết, nơi tác giả có thể chia sẻ câu chuyện, ghi chú hoặc suy nghĩ hằng ngày.",
    createdAt: new Date("2025-08-24"),
    publishedAt: new Date("2025-08-24"),
  },
  {
    _id: "demo-2",
    title: "Why I Write",
    content:
      "Viết giúp tôi lưu lại những thay đổi nhỏ trong cách nhìn thế giới. Một blog đơn giản nên để chữ làm nhân vật chính, không cần nhiều thành phần trang trí.",
    createdAt: new Date("2025-09-03"),
    publishedAt: new Date("2025-09-03"),
  },
];

async function getPosts(): Promise<BlogPost[]> {
  try {
    await connectMongo();

    const posts = await Post.find({ publishedAt: { $ne: null } })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    return posts.length
      ? posts.map((post) => ({
          _id: String(post._id),
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          publishedAt: post.publishedAt ?? undefined,
        }))
      : fallbackPosts;
  } catch {
    return fallbackPosts;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default async function Home() {
  const posts = await getPosts();
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <main className="site-shell">
      <header className="site-header">
        <h1>Optone</h1>
        <nav aria-label="Main navigation">
          <a href="/">Blog</a>
          <a href="#about">About Me</a>
          <a href="#why">Why I Write</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="content-layout" aria-label="Blog content">
        <article className="featured-post">
          <h2>{featuredPost.title}</h2>
          <div className="post-meta">
            <span>Posted on {formatDate(featuredPost.publishedAt ?? featuredPost.createdAt)}</span>
          </div>
          <p>{featuredPost.content}</p>
        </article>

        <aside className="post-list" aria-label="Post list">
          <h2>All Posts</h2>
          <ul>
            {posts.map((post) => (
              <li key={post._id}>
                <a href={`#post-${post._id}`}>{post.title}</a>
                <time dateTime={new Date(post.publishedAt ?? post.createdAt).toISOString()}>
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {remainingPosts.length > 0 && (
        <section className="archive" aria-label="More posts">
          {remainingPosts.map((post) => (
            <article id={`post-${post._id}`} key={post._id}>
              <h2>{post.title}</h2>
              <time dateTime={new Date(post.publishedAt ?? post.createdAt).toISOString()}>
                {formatDate(post.publishedAt ?? post.createdAt)}
              </time>
              <p>{post.content}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

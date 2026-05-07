"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

export type FeedPost = {
  _id: string;
  title: string;
  content: string;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  authorId?: {
    email?: string;
  };
};

export type FeedRevision = {
  _id: string;
  postId: string;
  oldTitle?: string;
  newTitle?: string;
  oldContent: string;
  newContent: string;
  changedFields?: string[];
  editedAt?: string;
  editedBy?: {
    email?: string;
  };
};

type BlogFeedProps = {
  initialPosts: FeedPost[];
  initialHistories: FeedRevision[];
  isAdmin: boolean;
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Draft";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getPostId(revision: FeedRevision) {
  if (typeof revision.postId === "string") {
    return revision.postId;
  }

  return String(revision.postId);
}

function getChangedText(history: FeedRevision) {
  const fields = history.changedFields || [];

  if (fields.length === 0) {
    return "Updated post";
  }

  return `Updated ${fields.join(" and ")}`;
}

function RevisionTimeline({ post, histories }: { post: FeedPost; histories: FeedRevision[] }) {
  return (
    <section className="revision-timeline" aria-label={`Lịch sử của ${post.title}`}>
      <h3>Activity</h3>
      <ol>
        <li>
          <span>Posted by {post.authorId?.email || "unknown"}</span>
          <time>{formatDateTime(post.publishedAt || post.createdAt)}</time>
        </li>
        {histories.map((history) => (
          <li key={history._id}>
            <span>
              {getChangedText(history)} by {history.editedBy?.email || "unknown"}
            </span>
            {history.oldTitle && history.newTitle && history.oldTitle !== history.newTitle && (
              <p className="revision-detail">
                {history.oldTitle} {"->"} {history.newTitle}
              </p>
            )}
            <time>{formatDateTime(history.editedAt)}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}

function EditablePost({
  post,
  histories,
  isAdmin,
  featured,
  onSaved,
}: {
  post: FeedPost;
  histories: FeedRevision[];
  isAdmin: boolean;
  featured?: boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) {
      setTitle(post.title);
      setContent(post.content);
    }
  }, [editing, post.content, post.title]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not save post");
        return;
      }

      setEditing(false);
      onSaved();
    } catch {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const ArticleTag = featured ? "article" : "article";

  return (
    <ArticleTag className={featured ? "featured-post" : undefined} id={`post-${post._id}`}>
      {editing ? (
        <form className="edit-post-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Content
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={8}
              required
            />
          </label>
          {message && <p className="form-message">{message}</p>}
          <div className="edit-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="article-heading">
            <h2>{post.title}</h2>
            {isAdmin && (
              <button
                className="edit-icon-button"
                type="button"
                onClick={() => setEditing(true)}
                aria-label={`Edit ${post.title}`}
                title="Edit"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            )}
          </div>
          <div className="post-meta">
            <time>{formatDateTime(post.publishedAt || post.createdAt)}</time>
          </div>
          <p>{post.content}</p>
        </>
      )}

      <RevisionTimeline post={post} histories={histories} />
    </ArticleTag>
  );
}

export function BlogFeed({ initialPosts, initialHistories, isAdmin }: BlogFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [histories, setHistories] = useState(initialHistories);

  async function refreshPosts() {
    const response = await fetch("/api/posts", {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as {
      posts?: FeedPost[];
      histories?: FeedRevision[];
    };

    setPosts(data.posts || []);
    setHistories(data.histories || []);
  }

  useEffect(() => {
    const interval = window.setInterval(refreshPosts, 4000);
    window.addEventListener("posts:changed", refreshPosts);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("posts:changed", refreshPosts);
    };
  }, []);

  const historiesByPost = useMemo(() => {
    return histories.reduce<Record<string, FeedRevision[]>>((result, history) => {
      const postId = getPostId(history);
      result[postId] ||= [];
      result[postId].push(history);
      return result;
    }, {});
  }, [histories]);

  const featuredPost = posts[0];
  const archivePosts = posts.slice(1);

  if (!featuredPost) {
    return (
      <section className="empty-state">
        <h2>No posts yet</h2>
        <p>{isAdmin ? "Publish the first post above." : "Please check back later."}</p>
      </section>
    );
  }

  return (
    <>
      <section className="content-layout">
        <EditablePost
          post={featuredPost}
          histories={historiesByPost[featuredPost._id] || []}
          isAdmin={isAdmin}
          featured
          onSaved={refreshPosts}
        />

        <aside className="post-list">
          <h2>Latest</h2>
          <ul>
            {posts.map((post) => (
              <li key={post._id}>
                <a href={`#post-${post._id}`}>{post.title}</a>
                <time>{formatDateTime(post.publishedAt || post.createdAt)}</time>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {archivePosts.length > 0 && (
        <section className="archive">
          {archivePosts.map((post) => (
            <EditablePost
              key={post._id}
              post={post}
              histories={historiesByPost[post._id] || []}
              isAdmin={isAdmin}
              onSaved={refreshPosts}
            />
          ))}
        </section>
      )}
    </>
  );
}

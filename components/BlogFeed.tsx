"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

export type FeedPost = {
  _id: string;
  title: string;
  content: string;
  project?: string;
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
  action?: "posted" | "updated";
  title?: string;
  content?: string;
  project?: string;
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
  projects: string[];
  isAdmin: boolean;
};

const POSTS_PER_PAGE = 5;

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
  if (history.action === "posted") {
    return "Posted";
  }

  const fields = history.changedFields || [];

  if (fields.length === 0) {
    return "Updated post";
  }

  return `Updated ${fields.join(" and ")}`;
}

function getRevisionTitle(history: FeedRevision) {
  return history.title || history.newTitle || history.oldTitle || "Untitled";
}

function getRevisionContent(history: FeedRevision) {
  return history.content || history.newContent || history.oldContent;
}

function RevisionTimeline({
  post,
  histories,
  selectedRevisionId,
  onSelectRevision,
  onShowCurrent,
}: {
  post: FeedPost;
  histories: FeedRevision[];
  selectedRevisionId: string;
  onSelectRevision: (revisionId: string) => void;
  onShowCurrent: () => void;
}) {
  const hasPostedHistory = histories.some((history) => history.action === "posted");
  const rows = hasPostedHistory
    ? histories
    : [
        ...histories,
        {
          _id: "posted-current",
          postId: post._id,
          action: "posted" as const,
          title: post.title,
          content: post.content,
          project: post.project,
          oldContent: "",
          newContent: post.content,
          editedAt: post.publishedAt || post.createdAt,
          editedBy: post.authorId,
        },
      ];

  const sortedRows = [...rows].sort((left, right) => {
    const leftTime = new Date(left.editedAt || 0).getTime();
    const rightTime = new Date(right.editedAt || 0).getTime();

    return rightTime - leftTime;
  });

  return (
    <section className="revision-timeline" aria-label={`Lich su cua ${post.title}`}>
      <div className="timeline-heading">
        <h3>Activity</h3>
        {selectedRevisionId !== "current" && (
          <button type="button" onClick={onShowCurrent}>
            Current version
          </button>
        )}
      </div>
      <ol>
        {sortedRows.map((history) => (
          <li
            key={history._id}
            className={selectedRevisionId === history._id ? "active-history" : undefined}
          >
            <button type="button" onClick={() => onSelectRevision(history._id)}>
              <span>
                {getChangedText(history)} by {history.editedBy?.email || "unknown"}
              </span>
              {history.oldTitle && history.newTitle && history.oldTitle !== history.newTitle && (
                <span className="revision-detail">
                  {history.oldTitle} {"->"} {history.newTitle}
                </span>
              )}
              <time>{formatDateTime(history.editedAt)}</time>
            </button>
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
  projects,
  onSaved,
}: {
  post: FeedPost;
  histories: FeedRevision[];
  isAdmin: boolean;
  projects: string[];
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [project, setProject] = useState(post.project || "");
  const [selectedRevisionId, setSelectedRevisionId] = useState("current");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedRevisionId("current");
    setEditing(false);
    setMessage("");
  }, [post._id]);

  useEffect(() => {
    if (!editing) {
      setTitle(post.title);
      setContent(post.content);
      setProject(post.project || "");
    }
  }, [editing, post.content, post.project, post.title]);

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
        body: JSON.stringify({ title, content, project }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not save post");
        return;
      }

      setEditing(false);
      setSelectedRevisionId("current");
      onSaved();
    } catch {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const selectedRevision =
    selectedRevisionId === "posted-current"
      ? undefined
      : histories.find((history) => history._id === selectedRevisionId);
  const viewingHistory = selectedRevisionId !== "current";
  const visibleTitle = selectedRevision ? getRevisionTitle(selectedRevision) : post.title;
  const visibleContent = selectedRevision ? getRevisionContent(selectedRevision) : post.content;
  const visibleProject = selectedRevision?.project || post.project;
  const visibleDate = selectedRevision
    ? selectedRevision.editedAt
    : post.publishedAt || post.createdAt;

  return (
    <article className="featured-post" id={`post-${post._id}`}>
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
          <label>
            Project
            <select value={project} onChange={(event) => setProject(event.target.value)} required>
              <option value="">Select project</option>
              {projects.map((projectName) => (
                <option key={projectName} value={projectName}>
                  {projectName}
                </option>
              ))}
            </select>
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
            <h2>{visibleTitle}</h2>
            {isAdmin && !viewingHistory && (
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
            <time>{formatDateTime(visibleDate)}</time>
            {visibleProject && <span>{visibleProject}</span>}
            {viewingHistory && <span>Activity snapshot</span>}
          </div>
          <p>{visibleContent}</p>
        </>
      )}

      <RevisionTimeline
        post={post}
        histories={histories}
        selectedRevisionId={selectedRevisionId}
        onSelectRevision={(revisionId) => {
          setSelectedRevisionId(revisionId);
          setEditing(false);
        }}
        onShowCurrent={() => setSelectedRevisionId("current")}
      />
    </article>
  );
}

export function BlogFeed({ initialPosts, initialHistories, projects, isAdmin }: BlogFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [histories, setHistories] = useState(initialHistories);
  const [selectedPostId, setSelectedPostId] = useState(initialPosts[0]?._id || "");
  const [latestPage, setLatestPage] = useState(0);
  const [projectPages, setProjectPages] = useState<Record<string, number>>({});

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

  useEffect(() => {
    if (posts.length === 0) {
      setSelectedPostId("");
      return;
    }

    if (!posts.some((post) => post._id === selectedPostId)) {
      setSelectedPostId(posts[0]._id);
    }
  }, [posts, selectedPostId]);

  const historiesByPost = useMemo(() => {
    return histories.reduce<Record<string, FeedRevision[]>>((result, history) => {
      const postId = getPostId(history);
      result[postId] ||= [];
      result[postId].push(history);
      return result;
    }, {});
  }, [histories]);

  const postsByProject = useMemo(() => {
    return posts.reduce<Record<string, FeedPost[]>>((result, post) => {
      const projectName = post.project?.trim();
      if (!projectName) {
        return result;
      }

      result[projectName] ||= [];
      result[projectName].push(post);
      return result;
    }, {});
  }, [posts]);

  const projectGroups = Object.entries(postsByProject).sort(([projectA], [projectB]) =>
    projectA.localeCompare(projectB, "vi")
  );

  const selectedPost = posts.find((post) => post._id === selectedPostId) || posts[0];
  const latestPageCount = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const safeLatestPage = Math.min(latestPage, latestPageCount - 1);
  const latestPosts = posts.slice(
    safeLatestPage * POSTS_PER_PAGE,
    safeLatestPage * POSTS_PER_PAGE + POSTS_PER_PAGE
  );

  if (!selectedPost) {
    return (
      <section className="empty-state">
        <h2>No posts yet</h2>
        <p>{isAdmin ? "Publish the first post above." : "Please check back later."}</p>
      </section>
    );
  }

  function selectPost(postId: string) {
    setSelectedPostId(postId);
    window.history.replaceState(null, "", `#post-${postId}`);
  }

  function changeProjectPage(projectName: string, direction: "previous" | "next") {
    setProjectPages((currentPages) => {
      const projectPostCount = postsByProject[projectName]?.length || 0;
      const pageCount = Math.max(1, Math.ceil(projectPostCount / POSTS_PER_PAGE));
      const currentPage = Math.min(currentPages[projectName] || 0, pageCount - 1);
      const nextPage =
        direction === "next"
          ? Math.min(currentPage + 1, pageCount - 1)
          : Math.max(currentPage - 1, 0);

      return {
        ...currentPages,
        [projectName]: nextPage,
      };
    });
  }

  return (
    <section className="content-layout">
      <EditablePost
        key={selectedPost._id}
        post={selectedPost}
        histories={historiesByPost[selectedPost._id] || []}
        isAdmin={isAdmin}
        projects={projects}
        onSaved={refreshPosts}
      />

      <aside className="sidebar-panels" aria-label="Post navigation">
        <section className="post-list">
          <h2>Latest</h2>
          <ul>
            {latestPosts.map((post) => (
              <li key={post._id} className={post._id === selectedPost._id ? "active-post" : undefined}>
                <button type="button" onClick={() => selectPost(post._id)}>
                  <span>{post.title}</span>
                  <time>{formatDateTime(post.publishedAt || post.createdAt)}</time>
                </button>
              </li>
            ))}
          </ul>
          {posts.length > POSTS_PER_PAGE && (
            <div className="list-pagination" aria-label="Latest pagination">
              <button
                type="button"
                onClick={() => setLatestPage((page) => Math.max(page - 1, 0))}
                disabled={safeLatestPage === 0}
              >
                Previous
              </button>
              <span>
                {safeLatestPage + 1}/{latestPageCount}
              </span>
              <button
                type="button"
                onClick={() => setLatestPage((page) => Math.min(page + 1, latestPageCount - 1))}
                disabled={safeLatestPage === latestPageCount - 1}
              >
                Next
              </button>
            </div>
          )}
        </section>

        {projectGroups.length > 0 && (
          <section className="project-list" aria-label="Projects">
            <h2>Projects</h2>
            {projectGroups.map(([projectName, projectPosts]) => (
              <ProjectCard
                key={projectName}
                projectName={projectName}
                posts={projectPosts}
                selectedPostId={selectedPost._id}
                page={projectPages[projectName] || 0}
                onPrevious={() => changeProjectPage(projectName, "previous")}
                onNext={() => changeProjectPage(projectName, "next")}
                onSelectPost={selectPost}
              />
            ))}
          </section>
        )}
      </aside>
    </section>
  );
}

function ProjectCard({
  projectName,
  posts,
  selectedPostId,
  page,
  onPrevious,
  onNext,
  onSelectPost,
}: {
  projectName: string;
  posts: FeedPost[];
  selectedPostId: string;
  page: number;
  onPrevious: () => void;
  onNext: () => void;
  onSelectPost: (postId: string) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const visiblePosts = posts.slice(
    safePage * POSTS_PER_PAGE,
    safePage * POSTS_PER_PAGE + POSTS_PER_PAGE
  );

  return (
    <article className="project-card">
      <h3>
        {projectName}
        <span>{posts.length}</span>
      </h3>
      <ul>
        {visiblePosts.map((post) => (
          <li key={post._id} className={post._id === selectedPostId ? "active-post" : undefined}>
            <button type="button" onClick={() => onSelectPost(post._id)}>
              <span>{post.title}</span>
              <time>{formatDateTime(post.publishedAt || post.createdAt)}</time>
            </button>
          </li>
        ))}
      </ul>
      {posts.length > POSTS_PER_PAGE && (
        <div className="list-pagination" aria-label={`${projectName} pagination`}>
          <button type="button" onClick={onPrevious} disabled={safePage === 0}>
            Previous
          </button>
          <span>
            {safePage + 1}/{pageCount}
          </span>
          <button type="button" onClick={onNext} disabled={safePage === pageCount - 1}>
            Next
          </button>
        </div>
      )}
    </article>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PostComposer() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          publishedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not publish post");
        return;
      }

      setTitle("");
      setContent("");
      setMessage("Post published");
      setIsOpen(false);
      window.dispatchEvent(new Event("posts:changed"));
      router.refresh();
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <section className="composer-toolbar" aria-label="Post actions">
        <button type="button" className="new-post-button" onClick={() => setIsOpen(true)}>
          <span aria-hidden="true">+</span>
          New post
        </button>
      </section>
    );
  }

  return (
    <form className="post-composer" onSubmit={handleSubmit}>
      <div className="composer-heading">
        <h2>New post</h2>
        <button
          type="button"
          className="composer-close"
          onClick={() => setIsOpen(false)}
          disabled={loading}
          aria-label="Close new post form"
          title="Close"
        >
          ×
        </button>
      </div>

      <label>
        Title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </label>

      <label>
        Content
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
          rows={8}
        />
      </label>

      {message && <p className="form-message">{message}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Publishing..." : "Publish"}
      </button>
    </form>
  );
}

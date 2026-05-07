"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PostComposer() {
  const router = useRouter();
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
      window.dispatchEvent(new Event("posts:changed"));
      router.refresh();
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="post-composer" onSubmit={handleSubmit}>
      <h2>New post</h2>

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

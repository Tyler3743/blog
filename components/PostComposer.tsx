"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PostComposerProps = {
  existingProjects?: string[];
};

export function PostComposer({ existingProjects = [] }: PostComposerProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [project, setProject] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [localProjects, setLocalProjects] = useState<string[]>([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const projectOptions = useMemo(() => {
    const allProjects = [...existingProjects, ...localProjects];

    return Array.from(
      new Set(
        allProjects
          .map((projectName) => projectName.trim())
          .filter(Boolean)
      )
    );
  }, [existingProjects, localProjects]);

  function handleAddProject() {
    const trimmedProject = newProjectName.trim();

    if (!trimmedProject) {
      setMessage("Please enter a project name");
      return;
    }

    setLocalProjects((currentProjects) => {
      if (currentProjects.includes(trimmedProject)) {
        return currentProjects;
      }

      return [...currentProjects, trimmedProject];
    });

    setProject(trimmedProject);
    setNewProjectName("");
    setShowNewProjectInput(false);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (!title.trim() || !content.trim() || !project.trim()) {
      setMessage("Please enter title, content, and project");
      return;
    }

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
          project,
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
      setProject("");
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
      <div className="composer-toolbar">
        <button
          type="button"
          className="new-post-button"
          onClick={() => setIsOpen(true)}
        >
          <span>+</span>
          New post
        </button>
      </div>
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
        Project
        <select
          value={project}
          onChange={(event) => setProject(event.target.value)}
          required
        >
          <option value="">Select project</option>

          {projectOptions.map((projectName) => (
            <option key={projectName} value={projectName}>
              {projectName}
            </option>
          ))}
        </select>
      </label>

      {!showNewProjectInput ? (
        <button
          type="button"
          onClick={() => setShowNewProjectInput(true)}
        >
          + New project
        </button>
      ) : (
        <>
          <label>
            New project name
            <input
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="Example: Minimal Blog"
            />
          </label>

          <div className="edit-actions">
            <button type="button" onClick={handleAddProject}>
              Add project
            </button>

            <button
              type="button"
              onClick={() => {
                setShowNewProjectInput(false);
                setNewProjectName("");
                setMessage("");
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

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
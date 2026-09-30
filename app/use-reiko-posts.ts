"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Post } from "./reiko-content";

export function useReikoPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [postsExpanded, setPostsExpanded] = useState(false);
  const orderedPosts = useMemo(() => [...posts].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() || right.id - left.id), [posts]);
  const visiblePosts = useMemo(() => orderedPosts.slice(0, postsExpanded ? 12 : 6), [orderedPosts, postsExpanded]);

  useEffect(() => {
    fetch("/api/posts")
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "动态暂时无法读取。"); setPosts(Array.isArray(data.posts) ? data.posts : []); })
      .catch((error) => setMessage(error instanceof Error ? error.message : "动态暂时无法读取。"))
      .finally(() => setLoading(false));
  }, []);

  async function publish(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || publishing) return;
    setPublishing(true); setMessage("");
    try {
      const response = await fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "发布失败，请再试一次。");
      setPosts((current) => [data.post, ...current]); setDraft(""); setMessage("已经留在这里了。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "发布失败，请再试一次。"); }
    finally { setPublishing(false); }
  }

  return { posts, orderedPosts, visiblePosts, draft, setDraft, loading, publishing, message, postsExpanded, setPostsExpanded, publish };
}

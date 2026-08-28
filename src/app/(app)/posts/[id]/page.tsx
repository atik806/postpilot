import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { getPost } from "@/server/posts";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { PostStatusBadge } from "@/components/common/status-badge";
import { PostDetailClient } from "./detail-client";

export const metadata: Metadata = { title: "Post" };

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let post;
  try {
    post = await getPost(id);
  } catch (err) {
    if (err instanceof AppError && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  return (
    <PageBody>
      <PageHeader
        title={post.title || "Untitled post"}
        description={
          post.scheduledAt
            ? `Scheduled for ${new Date(post.scheduledAt).toLocaleString()}`
            : post.publishedAt
              ? `Published ${new Date(post.publishedAt).toLocaleString()}`
              : "Draft"
        }
        actions={<PostStatusBadge status={post.status} />}
      />
      <PostDetailClient post={post} />
    </PageBody>
  );
}

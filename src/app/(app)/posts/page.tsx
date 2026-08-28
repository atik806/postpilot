import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { listPosts } from "@/server/posts";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { PostsClient } from "./posts-client";

export const metadata: Metadata = { title: "Posts" };

const FILTERS = ["all", "draft", "scheduled", "published", "failed"] as const;

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = (
    FILTERS.includes(params.filter as never) ? params.filter : "all"
  ) as (typeof FILTERS)[number];
  const search = typeof params.search === "string" ? params.search : "";

  const posts = await listPosts({ filter, search });

  return (
    <PageBody>
      <PageHeader
        title="Posts"
        description="Every draft, scheduled and published post."
        actions={
          <Button asChild>
            <Link href="/create">
              <PlusCircle className="size-4" /> Create Post
            </Link>
          </Button>
        }
      />
      <PostsClient posts={posts} filter={filter} search={search} />
    </PageBody>
  );
}

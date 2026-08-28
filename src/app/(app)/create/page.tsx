import type { Metadata } from "next";
import { listPublishableAccounts } from "@/server/social-accounts";
import { getPost } from "@/server/posts";
import { isAIConfigured } from "@/lib/ai";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { PostComposer } from "@/features/composer/post-composer";
import type { PostDetail } from "@/server/posts";

export const metadata: Metadata = { title: "Create Post" };

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const editId = typeof params.post === "string" ? params.post : null;

  const [accounts, initialPost] = await Promise.all([
    listPublishableAccounts(),
    editId ? getPost(editId).catch(() => null) : Promise.resolve<PostDetail | null>(null),
  ]);

  return (
    <PageBody className="max-w-7xl">
      <PageHeader
        title={initialPost ? "Edit post" : "Create Post"}
        description="Write once, preview per platform, publish everywhere."
      />
      <PostComposer
        initialPost={initialPost}
        accounts={accounts.map((a) => ({
          id: a.id,
          platform: a.platform,
          accountName: a.accountName,
        }))}
        aiConfigured={isAIConfigured()}
      />
    </PageBody>
  );
}

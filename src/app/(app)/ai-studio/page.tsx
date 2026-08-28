import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { isAIConfigured } from "@/lib/ai";
import { env } from "@/lib/env";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { StudioClient } from "./studio-client";

export const metadata: Metadata = { title: "AI Studio" };

export default function AiStudioPage() {
  const configured = isAIConfigured();

  return (
    <PageBody>
      <PageHeader
        title="AI Studio"
        description={`Draft captions and adapt content per platform${
          configured ? ` · ${env.aiProvider}` : ""
        }.`}
      />
      {configured ? (
        <StudioClient />
      ) : (
        <EmptyState
          icon={Sparkles}
          title="AI isn't configured"
          description="Add ANTHROPIC_API_KEY (or OPENAI_API_KEY and set AI_PROVIDER=openai) to your environment to use the AI Studio."
        />
      )}
    </PageBody>
  );
}

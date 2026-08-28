import type { Metadata } from "next";
import { listCampaigns } from "@/server/campaigns";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { CampaignsClient } from "./campaigns-client";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();
  return (
    <PageBody>
      <PageHeader
        title="Campaigns"
        description="Create and manage multi-day social campaigns."
      />
      <CampaignsClient campaigns={campaigns} />
    </PageBody>
  );
}

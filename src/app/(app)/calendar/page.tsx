import type { Metadata } from "next";
import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { calendarPosts } from "@/server/posts";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { CalendarClient } from "./calendar-client";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const now = new Date();
  const posts = await calendarPosts(
    startOfMonth(subMonths(now, 1)).toISOString(),
    endOfMonth(addMonths(now, 2)).toISOString(),
  );

  return (
    <PageBody>
      <PageHeader
        title="Content Calendar"
        description="Every scheduled post, timezone-aware."
      />
      <CalendarClient posts={posts} />
    </PageBody>
  );
}

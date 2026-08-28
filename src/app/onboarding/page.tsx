import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, getWorkspaceContext } from "@/server/session";
import { Logo } from "@/components/brand/logo";
import { OnboardingWizard } from "./wizard";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const forceNew = params?.new === "1";
  const ctx = await getWorkspaceContext();
  if (ctx && !forceNew) redirect("/dashboard");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Logo className="mb-8" />
        <OnboardingWizard
          name={user.profile.name}
          allowSkip={Boolean(ctx)}
        />
      </div>
    </div>
  );
}

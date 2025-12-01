import { headers } from "next/headers";

import { whopsdk } from "@/lib/whop-sdk";

import { getCompanyAnalytics } from "@/lib/whop/data";

import Crownboard from "@/components/Crownboard";

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function DashboardPage({ params }: PageProps) {
  const { companyId } = await params;

  if (!companyId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-4 shadow-lg">
          <h1 className="text-lg font-semibold">Missing company context</h1>
          <p className="mt-2 text-sm text-red-100/80">
            Expected route: <code>/dashboard/[companyId]</code>.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Verify the Whop user token using headers from the iframe request
  const { userId } = await whopsdk.verifyUserToken(await headers());

  // (Optional) If needed, check that this user can access this companyId:
  // const access = await whopsdk.users.checkAccess(companyId, { id: userId });
  // if (access.access_level !== "admin") {
  //   return <div>Admin access required</div>;
  // }

  const analytics = await getCompanyAnalytics(companyId, userId);

  return (
    <Crownboard
      mode="live"
      companyId={companyId}
      userId={userId}
      topSpenders={analytics.topSpenders}
      topAffiliates={analytics.topAffiliates}
      mostActiveMembers={analytics.mostActiveMembers}
      randomWinnerPool={analytics.randomWinnerPool}
    />
  );
}

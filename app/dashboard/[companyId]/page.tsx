import { headers } from "next/headers";

import { whopsdk } from "@/lib/whop-sdk";

import { getCompanyAnalytics } from "@/lib/whop/data";

import Crownboard from "@/components/Crownboard";

import React from "react";

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function DashboardPage({ params }: PageProps) {
  const resolvedParams = await params;
  const companyId = resolvedParams?.companyId;

  if (!companyId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-4 shadow-lg">
          <h1 className="text-lg font-semibold">Missing company context</h1>
          <p className="mt-2 text-sm text-red-100/80">
            Expected route: <code>/dashboard/[companyId]</code>.  
            Please configure the Whop Dashboard View to point to this route.
          </p>
        </div>
      </div>
    );
  }

  // Try to verify Whop user token
  let userId: string;

  try {
    const hdrs = await headers();

    // In production, require a valid Whop session
    if (process.env.NODE_ENV === "production") {
      const verified = await whopsdk.verifyUserToken(hdrs);
      userId = (verified as any)?.userId ?? (verified as any)?.id;

      if (!userId) {
        throw new Error("Missing userId in verified Whop token");
      }
    } else {
      // Dev mode: allow a fake userId if verification fails
      try {
        const verified = await whopsdk.verifyUserToken(hdrs);
        userId = (verified as any)?.userId ?? (verified as any)?.id ?? "dev_user";
      } catch {
        userId = "dev_user";
      }
    }
  } catch {
    // No valid Whop session and not in dev
    if (process.env.NODE_ENV === "production") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-6 py-4 shadow-lg">
            <h1 className="text-lg font-semibold">Invalid Whop session</h1>
            <p className="mt-2 text-sm text-yellow-100/80">
              Please launch <span className="font-semibold">Crownboard</span> from inside the Whop dashboard
              via <strong>Apps → Crownboard</strong>.
            </p>
          </div>
        </div>
      );
    } else {
      // Dev fallback
      userId = "dev_user";
    }
  }

  // At this point we have a companyId and a userId (real or dev)
  const analytics = await getCompanyAnalytics(companyId, userId);

  // Pass real data into your existing UI.
  // Using "as any" here to avoid type mismatch with your existing Crownboard props.
  return (
    <Crownboard
      companyId={companyId}
      userId={userId}
      {...(analytics as any)}
    />
  );
}

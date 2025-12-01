import { whopsdk } from "@/lib/whop-sdk";

// Very generic types to avoid build failures.
// You can tighten these later once you inspect Whop responses.
export type LeaderboardEntry = {
  id: string;
  name: string;
  handle?: string;
  totalSpend?: number;
  lastActiveAt?: string | null;
  purchasesCount?: number;
};

export type CompanyAnalytics = {
  topSpenders: LeaderboardEntry[];
  topAffiliates: LeaderboardEntry[];
  mostActiveMembers: LeaderboardEntry[];
  randomWinnerPool: LeaderboardEntry[];
};

export async function getCompanyAnalytics(
  companyId: string,
  userId: string
): Promise<CompanyAnalytics> {
  // Optionally: verify access, etc. using userId if needed.

  // 1) Get Whop resource clients (these are PROMISES!)
  const [membersClient, purchasesClient, affiliatesClient] = await Promise.all([
    whopsdk.members(),
    whopsdk.purchases(),
    whopsdk.affiliates(),
  ]);

  // 2) Fetch data for this company
  const [membersResponse, purchasesResponse, affiliatesResponse] =
    await Promise.all([
      membersClient.list({ company_id: companyId }),
      purchasesClient.list({ company_id: companyId }),
      affiliatesClient.list({ company_id: companyId }),
    ]);

  const members: any[] = (membersResponse as any)?.data ?? [];
  const purchases: any[] = (purchasesResponse as any)?.data ?? [];
  const affiliates: any[] = (affiliatesResponse as any)?.data ?? [];

  // Helper to find member name from an id
  const memberById = new Map<string, any>();
  for (const m of members) {
    if (!m) continue;
    const id = m.id ?? m.member_id ?? m.user_id;
    if (id) memberById.set(String(id), m);
  }

  // 3) Aggregate spend by member from purchases
  const spendByMember = new Map<string, { total: number; count: number }>();

  for (const p of purchases) {
    if (!p) continue;

    const memberId =
      p.member_id ?? p.user_id ?? p.customer_id ?? p.buyer_id ?? null;
    if (!memberId) continue;

    const amount =
      Number(p.amount) ||
      Number(p.price) ||
      Number(p.total) ||
      Number(p.total_amount) ||
      0;

    const key = String(memberId);
    const prev = spendByMember.get(key) ?? { total: 0, count: 0 };
    spendByMember.set(key, {
      total: prev.total + (Number.isFinite(amount) ? amount : 0),
      count: prev.count + 1,
    });
  }

  // 4) Build top spenders leaderboard
  const topSpenders: LeaderboardEntry[] = Array.from(spendByMember.entries())
    .map(([memberId, stats]) => {
      const m = memberById.get(memberId) ?? {};
      return {
        id: memberId,
        name:
          m.username ||
          m.handle ||
          m.name ||
          m.display_name ||
          `Member ${memberId}`,
        handle: m.handle ?? m.username ?? null,
        totalSpend: stats.total,
        purchasesCount: stats.count,
        lastActiveAt:
          m.last_active_at ?? m.last_seen_at ?? m.updated_at ?? null,
      };
    })
    .sort((a, b) => (b.totalSpend ?? 0) - (a.totalSpend ?? 0))
    .slice(0, 25);

  // 5) Build most active members (by last_active_at or updated_at)
  const mostActiveMembers: LeaderboardEntry[] = members
    .map((m: any) => {
      const id = m.id ?? m.member_id ?? m.user_id;
      const name =
        m.username || m.handle || m.name || m.display_name || `Member ${id}`;
      const lastActive =
        m.last_active_at ??
        m.last_seen_at ??
        m.last_login_at ??
        m.updated_at ??
        null;

      return {
        id: String(id ?? name),
        name,
        handle: m.handle ?? m.username ?? null,
        lastActiveAt: lastActive,
      } as LeaderboardEntry;
    })
    .filter((m) => m.id)
    .sort((a, b) => {
      const aTime = a.lastActiveAt ? Date.parse(a.lastActiveAt) : 0;
      const bTime = b.lastActiveAt ? Date.parse(b.lastActiveAt) : 0;
      return bTime - aTime;
    })
    .slice(0, 25);

  // 6) Build top affiliates
  // We assume affiliatesResponse.data has fields like:
  //   id, name, username, total_revenue or total_earnings, referrals_count
  const topAffiliates: LeaderboardEntry[] = affiliates
    .map((a: any) => {
      const id = a.id ?? a.affiliate_id ?? a.user_id;
      const revenue =
        Number(a.total_revenue) ||
        Number(a.total_earnings) ||
        Number(a.revenue) ||
        0;

      return {
        id: String(id ?? a.name ?? a.username ?? "unknown_affiliate"),
        name: a.name || a.username || a.handle || `Affiliate ${id}`,
        handle: a.username ?? a.handle ?? null,
        totalSpend: revenue,
        purchasesCount:
          a.referrals_count ?? a.sales_count ?? a.conversions_count ?? 0,
      } as LeaderboardEntry;
    })
    .filter((a) => a.id)
    .sort((a, b) => (b.totalSpend ?? 0) - (a.totalSpend ?? 0))
    .slice(0, 25);

  // 7) Random winner pool — use all members who have spent > 0 or have any activity
  const randomWinnerPool: LeaderboardEntry[] = Array.from(
    new Set([
      ...topSpenders.map((m) => m.id),
      ...mostActiveMembers.map((m) => m.id),
    ])
  )
    .map((id) => {
      const baseMember =
        topSpenders.find((m) => m.id === id) ??
        mostActiveMembers.find((m) => m.id === id) ??
        null;

      if (baseMember) return baseMember;

      const m = memberById.get(id) ?? {};
      return {
        id,
        name:
          m.username ||
          m.handle ||
          m.name ||
          m.display_name ||
          `Member ${id}`,
        handle: m.handle ?? m.username ?? null,
      } as LeaderboardEntry;
    })
    .slice(0, 200); // keep it reasonable

  return {
    topSpenders,
    topAffiliates,
    mostActiveMembers,
    randomWinnerPool,
  };
}

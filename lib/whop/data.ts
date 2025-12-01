import { whopsdk } from "@/lib/whop-sdk";

// Very generic types to avoid build failures.
// You can tighten these later once you inspect Whop responses.
export type LeaderboardEntry = {
  id: string;
  name: string;
  handle?: string | null;
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

  // 1) Fetch all data using async iterators (handles pagination automatically)
  const members: any[] = [];
  for await (const m of whopsdk.members.list({ company_id: companyId })) {
    members.push(m);
  }

  const purchases: any[] = [];
  for await (const p of whopsdk.payments.list({ company_id: companyId })) {
    purchases.push(p);
  }

  // Note: Whop SDK doesn't have a direct affiliates resource
  // We'll derive affiliate data from payments that have affiliate information
  const affiliates: any[] = [];
  // Extract unique affiliates from payments
  const affiliateMap = new Map<string, any>();
  for (const p of purchases) {
    if (p.affiliate_id || p.affiliate?.id) {
      const affId = String(p.affiliate_id || p.affiliate?.id || '');
      if (!affiliateMap.has(affId)) {
        affiliateMap.set(affId, {
          id: affId,
          affiliate_id: affId,
          name: p.affiliate?.name || p.affiliate?.username || `Affiliate ${affId}`,
          username: p.affiliate?.username || p.affiliate?.name,
          handle: p.affiliate?.handle,
        });
      }
    }
  }
  affiliates.push(...Array.from(affiliateMap.values()));

  // Helper to find member name from an id
  const memberById = new Map<string, any>();
  for (const m of members) {
    if (!m) continue;
    const id = m.id ?? m.member_id ?? m.user_id;
    if (id) memberById.set(String(id), m);
  }

  // 2) Aggregate spend by member from purchases
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

  // 3) Build top spenders leaderboard
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

  // 4) Build most active members (by last_active_at or updated_at)
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

  // 5) Build top affiliates from payments with affiliate data
  // Aggregate affiliate earnings and referral counts from purchases
  const affiliateStats = new Map<string, { revenue: number; count: number; name: string; handle?: string }>();
  
  for (const p of purchases) {
    if (p.affiliate_id || p.affiliate?.id) {
      const affId = String(p.affiliate_id || p.affiliate?.id || '');
      const amount = Number(p.amount) || Number(p.price) || Number(p.total) || Number(p.total_amount) || 0;
      
      const existing = affiliateStats.get(affId) ?? {
        revenue: 0,
        count: 0,
        name: p.affiliate?.name || p.affiliate?.username || `Affiliate ${affId}`,
        handle: p.affiliate?.handle || p.affiliate?.username,
      };
      
      affiliateStats.set(affId, {
        revenue: existing.revenue + (Number.isFinite(amount) ? amount : 0),
        count: existing.count + 1,
        name: existing.name,
        handle: existing.handle,
      });
    }
  }

  const topAffiliates: LeaderboardEntry[] = Array.from(affiliateStats.entries())
    .map(([id, stats]) => ({
      id,
      name: stats.name,
      handle: stats.handle ?? null,
      totalSpend: stats.revenue,
      purchasesCount: stats.count,
    } as LeaderboardEntry))
    .sort((a, b) => (b.totalSpend ?? 0) - (a.totalSpend ?? 0))
    .slice(0, 25);

  // 6) Random winner pool — use all members who have spent > 0 or have any activity
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

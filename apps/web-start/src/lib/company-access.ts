export async function requireCompanyAccess(request: Request, companySlug: string) {
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { getCompanyAccessMembership } = await import("@workspace/db");
  const membership = await getCompanyAccessMembership(session.user.id, companySlug);
  // Drizzle's inferred select type can confuse no-unnecessary-condition here.
  // Runtime access checks still need to handle a missing membership.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!membership) {
    throw new Error("You do not have access to this company");
  }

  return {
    session,
    membership,
    company: {
      id: membership.companyId,
      slug: membership.companySlug,
      name: membership.companyName,
      displayName: membership.companyDisplayName,
    },
  };
}

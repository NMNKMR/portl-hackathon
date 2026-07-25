export const queryKeys = {
  session: ['session'] as const,
  memberships: {
    all: ['memberships'] as const,
    mine: () => [...queryKeys.memberships.all, 'mine'] as const,
    byFlat: (flatId: string) =>
      [...queryKeys.memberships.all, 'flat', flatId] as const,
    pendingHousehold: (flatId: string) =>
      [...queryKeys.memberships.all, 'pending-household', flatId] as const,
  },
  societies: {
    all: ['societies'] as const,
    detail: (id: string) => [...queryKeys.societies.all, id] as const,
  },
  blocks: {
    all: ['blocks'] as const,
    bySociety: (societyId: string) =>
      [...queryKeys.blocks.all, 'society', societyId] as const,
  },
  flats: {
    all: ['flats'] as const,
    bySociety: (societyId: string) =>
      [...queryKeys.flats.all, 'society', societyId] as const,
    joinInfo: (flatId: string) =>
      [...queryKeys.flats.all, 'join-info', flatId] as const,
  },
  visitorRequests: {
    all: ['visitor-requests'] as const,
    byFlat: (flatId: string) =>
      [...queryKeys.visitorRequests.all, 'flat', flatId] as const,
    bySociety: (societyId: string) =>
      [...queryKeys.visitorRequests.all, 'society', societyId] as const,
    detail: (id: string) => [...queryKeys.visitorRequests.all, id] as const,
    flatResidentsForGate: (flatId: string) =>
      [...queryKeys.visitorRequests.all, 'flat-residents', flatId] as const,
  },
  pushTokens: {
    all: ['push-tokens'] as const,
    mine: () => [...queryKeys.pushTokens.all, 'mine'] as const,
  },
  staff: {
    all: ['staff'] as const,
    categories: (societyId: string, seedIfMissing = false) =>
      [...queryKeys.staff.all, 'categories', societyId, seedIfMissing] as const,
    bySociety: (
      societyId: string,
      flatId: string | null,
      societyLevelOnly = false,
    ) =>
      [
        ...queryKeys.staff.all,
        'society',
        societyId,
        flatId,
        societyLevelOnly,
      ] as const,
    detail: (id: string) => [...queryKeys.staff.all, id] as const,
    byPass: (token: string) =>
      [...queryKeys.staff.all, 'pass', token] as const,
  },
  complaints: {
    all: ['complaints'] as const,
    bySociety: (societyId: string) =>
      [...queryKeys.complaints.all, 'society', societyId] as const,
    byFlat: (flatId: string) =>
      [...queryKeys.complaints.all, 'flat', flatId] as const,
    detail: (id: string) => [...queryKeys.complaints.all, id] as const,
  },
  notices: {
    all: ['notices'] as const,
    bySociety: (societyId: string) =>
      [...queryKeys.notices.all, 'society', societyId] as const,
    activeForMember: (societyId: string, membershipId: string) =>
      [
        ...queryKeys.notices.all,
        'active',
        societyId,
        membershipId,
      ] as const,
    detail: (id: string) => [...queryKeys.notices.all, id] as const,
  },
  polls: {
    all: ['polls'] as const,
    bySociety: (societyId: string, membershipId?: string) =>
      [
        ...queryKeys.polls.all,
        'society',
        societyId,
        membershipId ?? '',
      ] as const,
    openForMember: (societyId: string, membershipId: string) =>
      [
        ...queryKeys.polls.all,
        'open',
        societyId,
        membershipId,
      ] as const,
    detail: (id: string, membershipId?: string) =>
      [...queryKeys.polls.all, id, membershipId ?? ''] as const,
  },
} as const;

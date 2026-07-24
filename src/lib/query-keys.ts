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
  },
} as const;

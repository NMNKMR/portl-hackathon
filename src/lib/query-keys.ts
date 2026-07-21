export const queryKeys = {
  session: ['session'] as const,
  memberships: {
    all: ['memberships'] as const,
    mine: () => [...queryKeys.memberships.all, 'mine'] as const,
  },
  societies: {
    all: ['societies'] as const,
    detail: (id: string) => [...queryKeys.societies.all, id] as const,
  },
  flats: {
    all: ['flats'] as const,
    bySociety: (societyId: string) =>
      [...queryKeys.flats.all, 'society', societyId] as const,
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

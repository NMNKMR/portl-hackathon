import type { StaffMember } from '@/lib/api/staff';

export type StaffCategoryFilter = 'all' | string;

export function buildStaffCategoryFilters(
  staff: StaffMember[],
): { id: StaffCategoryFilter; label: string }[] {
  const names = new Set<string>();
  for (const member of staff) {
    const name = member.category_name?.trim();
    if (name) names.add(name);
  }
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  return [
    { id: 'all', label: 'All' },
    ...sorted.map((name) => ({ id: name, label: name })),
  ];
}

export function filterStaffByCategory(
  staff: StaffMember[],
  category: StaffCategoryFilter,
): StaffMember[] {
  if (category === 'all') return staff;
  return staff.filter((s) => (s.category_name ?? '').trim() === category);
}

export function filterStaffByQuery(
  staff: StaffMember[],
  query: string,
): StaffMember[] {
  const q = query.trim().toLowerCase();
  if (!q) return staff;
  return staff.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.phone ?? '').toLowerCase().includes(q) ||
      (s.category_name ?? '').toLowerCase().includes(q),
  );
}

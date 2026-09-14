export const resolveEffectiveHouseholdId = (
  storedId: string | null,
  households: { id: string }[],
): string | null => {
  if (households.length === 0) {
    return null;
  }

  if (storedId && households.some((item) => item.id === storedId)) {
    return storedId;
  }

  return households[0]?.id ?? null;
};

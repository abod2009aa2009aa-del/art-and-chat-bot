export function moderationOwnerId(): number | null {
  const value = process.env.OWNER_TELEGRAM_ID?.trim() ?? "";
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function isModerationOwner(userId: number): boolean {
  const ownerId = moderationOwnerId();
  return ownerId !== null && userId === ownerId;
}

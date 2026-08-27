export const PRESENCE_NAME_CATALOG = [
  { resourceId: 1, label: "בלופי" },
  { resourceId: 2, label: "צמרוני" },
  { resourceId: 3, label: "קפיצי" },
  { resourceId: 4, label: "טרלולי" },
  { resourceId: 5, label: "ביסי" },
  { resourceId: 6, label: "עינשי" },
  { resourceId: 7, label: "לשוני" },
  { resourceId: 8, label: "קשקושי" },
  { resourceId: 9, label: "פונפון" },
  { resourceId: 10, label: "זילי" },
  { resourceId: 11, label: "גיגלי" },
  { resourceId: 12, label: "משמש" },
  { resourceId: 13, label: "זללני" },
  { resourceId: 14, label: "שינשן" },
  { resourceId: 15, label: "ציקמוקי" },
  { resourceId: 16, label: "זיקי" },
  { resourceId: 17, label: "פלאפי" },
  { resourceId: 18, label: "זנבוני" },
  { resourceId: 19, label: "בבא" },
  { resourceId: 20, label: "סנוזי" },
] as const;

export const PRESENCE_AVATAR_CATALOG = Array.from({ length: 12 }, (_, index) => ({
  resourceId: index + 1,
  imagePath: `/avatars/${index + 1}.png`,
}));

export const PRESENCE_STALE_MS = 30_000;
export const PRESENCE_HEARTBEAT_MS = 30_000;
export const MAX_ONLINE_USERS = 12;

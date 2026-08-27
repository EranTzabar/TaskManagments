export const ACTIVE_PROJECT_COOKIE = "activeProjectId";

export function setActiveProjectIdCookie(projectId: number): void {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${ACTIVE_PROJECT_COOKIE}=${projectId}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function parseProjectIdParam(value: string | null | undefined): number | null {
  if (value == null || value === "") {
    return null;
  }

  const id = Number(value);
  return Number.isNaN(id) ? null : id;
}

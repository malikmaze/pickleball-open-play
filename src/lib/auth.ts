/**
 * Auth placeholder for future implementation.
 * Replace these stubs with real authentication (e.g. NextAuth, Clerk).
 */

export interface AuthUser {
  id: string;
  email: string;
  role: "player" | "organizer" | "admin";
}

export function getCurrentUser(): AuthUser | null {
  // MVP: no authentication
  return null;
}

export function isOrganizer(): boolean {
  // MVP: admin route is open; gate here when auth is added
  return true;
}

export function requireOrganizer(): boolean {
  return isOrganizer();
}

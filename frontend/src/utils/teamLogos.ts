/**
 * Shared team logo map and theme constants used across all CricInsight components.
 */

/* ── Team Logo Map (keys = exact team names from DB) ────────────────────── */
export const teamLogoMap: Record<string, string> = {
  "Chennai Super Kings": "/logos/csk.png",
  "Delhi Capitals": "/logos/dehlicapitals.png",
  "Gujarat Titans": "/logos/gujrattitans.png",
  "Kolkata Knight Riders": "/logos/kolkata.png",
  "Lucknow Super Giants": "/logos/lucknow.png",
  "Mumbai Indians": "/logos/mumbai.png",
  "Punjab Kings": "/logos/punjabkings.png",
  "Rajasthan Royals": "/logos/rr.png",
  "Royal Challengers Bengaluru": "/logos/rcb.png",
  "Sunrisers Hyderabad": "/logos/hyderabad.png",
  // Legacy / alternate names
  "Royal Challengers Bangalore": "/logos/rcb.png",
  "Delhi Daredevils": "/logos/dehlicapitals.png",
  "Deccan Chargers": "/logos/hyderabad.png",
  "Kings XI Punjab": "/logos/punjabkings.png",
  "Rising Pune Supergiant": "/logos/csk.png",
  "Rising Pune Supergiants": "/logos/csk.png",
  "Pune Warriors": "/logos/csk.png",
  "Gujarat Lions": "/logos/gujrattitans.png",
  "Kochi Tuskers Kerala": "/logos/rcb.png",
};

/** Fallback logo for teams not in the map */
export const DEFAULT_LOGO = "/logos/csk.png";

/** Get the logo path for a team, with fallback */
export function getTeamLogo(team: string): string {
  return teamLogoMap[team] ?? DEFAULT_LOGO;
}

/** Generate a UI avatar URL for a player */
export function getPlayerAvatar(name: string, size = 128): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e293b&color=e2e8f0&size=${size}&bold=true&font-size=0.4`;
}

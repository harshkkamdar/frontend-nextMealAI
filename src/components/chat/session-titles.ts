/**
 * Titles the conversation list has already shown, kept for this app session. The conversation screen reads its
 * title from here on push, so the header does not swap "Geo" for the title once history loads (motion-feel N10).
 */
export const sessionTitles = new Map<string, string>()

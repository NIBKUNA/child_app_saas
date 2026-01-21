
// ✨ [Sovereign Configuration] Center Identification
// This ID connects the frontend to a specific 'center' record in the database.
// For a new center deployment, update VITE_CENTER_ID in your .env or Vercel settings.
export const CURRENT_CENTER_ID = import.meta.env.VITE_CENTER_ID || "59d09adf-4c98-4013-a198-d7b26018fd29";

export const CENTER_DEFAULTS = {
    id: CURRENT_CENTER_ID,
    name: import.meta.env.VITE_CENTER_NAME || import.meta.env.VITE_SITE_TITLE || '아동발달센터',
    address: '서울특별시 송파구 석촌호수로12길 51 201호', // Default fallback
    phone: '02-416-2213' // Default fallback
};

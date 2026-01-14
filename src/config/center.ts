
export const JAMSIL_CENTER_ID = import.meta.env.VITE_CENTER_ID;

if (!JAMSIL_CENTER_ID) {
    console.error("❌ CRITICAL: VITE_CENTER_ID environment variable is missing!");
    // Default fallback or throw error? For now, we warn. 
    // Ideally this should crash the app if it's "Sovereign Template" based on a single ID.
}

export const CENTER_DEFAULTS = {
    id: JAMSIL_CENTER_ID,
    name: import.meta.env.VITE_SITE_TITLE || '자라다 아동심리발달센터',
    address: '서울특별시 송파구 석촌호수로12길 51 201호', // TODO: Move to Env if needed
    phone: '02-416-2213' // TODO: Move to Env if needed
};

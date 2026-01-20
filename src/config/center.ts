
// ✨ [Sovereign Configuration] Center Identification
// Priority: Environment Variable -> Hardcoded Fallback
export const JAMSIL_CENTER_ID = import.meta.env.VITE_CENTER_ID || "59d09adf-4c98-4013-a198-d7b26018fd29";


export const CENTER_DEFAULTS = {
    id: JAMSIL_CENTER_ID,
    name: import.meta.env.VITE_SITE_TITLE || '자라다 아동심리발달센터',
    address: '서울특별시 송파구 석촌호수로12길 51 201호', // TODO: Move to Env if needed
    phone: '02-416-2213' // TODO: Move to Env if needed
};

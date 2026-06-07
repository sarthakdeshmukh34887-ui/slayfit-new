// app.config.js
// Load environment variables from .env for Expo projects
// Ensure you have a .env file (gitignored) with your keys.
// This config merges existing app.json settings with the env vars.

module.exports = ({ config }) => {
  // Merge extra fields from environment variables
  const extra = {
    EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    // Preserve any existing extra fields from the static config
    ...(config.extra || {}),
  };

  return {
    ...config,
    // Keep original config values (name, slug, version, etc.)
    // Add the merged extra values so they are available via Constants.manifest.extra
    extra,
  };
};

export function missingFirebaseSettings(env: Record<string, string | undefined>): string[] {
  return ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_DATABASE_URL"]
    .filter((key) => !env[key]?.trim());
}

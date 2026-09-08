try {
  process.loadEnvFile();
} catch {
  // No .env file (e.g. CI, or a container that injects env vars directly) —
  // process.env is trusted as-is.
}

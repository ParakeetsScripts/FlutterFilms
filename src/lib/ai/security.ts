const PRIVATE_IPV4 =
  /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.)/;

export function validateSelfHostedUrl(raw: string, options: { allowLocalhost?: boolean } = {}): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid endpoint URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Endpoint must use http or https.");
  }
  const host = parsed.hostname.toLowerCase();
  if (!options.allowLocalhost && (host === "localhost" || host === "127.0.0.1" || host === "::1")) {
    throw new Error("Localhost endpoints are only allowed for explicitly configured Ollama.");
  }
  if (PRIVATE_IPV4.test(host) && !options.allowLocalhost) {
    throw new Error("Private network endpoints are not allowed.");
  }
  if (host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Internal hostnames are not allowed.");
  }
  return parsed.toString().replace(/\/$/, "");
}

export function isOllamaUrlAllowed(url: string): boolean {
  const configured = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "");
  if (!configured) return false;
  try {
    return validateSelfHostedUrl(url, { allowLocalhost: true }) === validateSelfHostedUrl(configured, { allowLocalhost: true });
  } catch {
    return false;
  }
}

export function assetUrl(path: string, baseUrl = import.meta.env.BASE_URL): string {
  const cleanPath = path.replace(/^\/+/, "");
  const cleanBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${cleanBase}${cleanPath}`;
}

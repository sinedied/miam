export type Route =
  | { readonly name: "catalog" }
  | { readonly name: "recipe"; readonly slug: string };

export function parseRoute(hash: string): Route {
  const match = /^#\/recipes\/([^/?#]+)\/?$/.exec(hash);
  if (!match?.[1]) {
    return { name: "catalog" };
  }

  try {
    return { name: "recipe", slug: decodeURIComponent(match[1]) };
  } catch {
    return { name: "recipe", slug: match[1] };
  }
}

export function recipeHref(slug: string): string {
  return `#/recipes/${encodeURIComponent(slug)}`;
}

/** Extracts the decoded `q` search query from a hash, or "" when absent. */
export function parseSearchQuery(hash: string): string {
  const queryStart = hash.indexOf("?");
  if (queryStart === -1) {
    return "";
  }

  return new URLSearchParams(hash.slice(queryStart + 1)).get("q") ?? "";
}

/** Builds the catalog hash for a search query (`#/` when the query is blank). */
export function catalogHref(query: string): string {
  return query.trim() ? `#/?q=${encodeURIComponent(query)}` : "#/";
}

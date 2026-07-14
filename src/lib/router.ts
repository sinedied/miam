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

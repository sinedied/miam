export interface BuildInfo {
  readonly commit: string;
  readonly deployedAt: string | null;
  readonly repositoryUrl: string | null;
}

export const buildInfo: BuildInfo = __MIAM_BUILD__;

export function formatDeploymentDate(value: string | null, locale: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

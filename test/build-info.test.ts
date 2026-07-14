import { describe, expect, it } from "vitest";
import { buildInfo, formatDeploymentDate } from "../src/lib/build-info";

describe("build information", () => {
  it("exposes values injected by the build", () => {
    expect(buildInfo.commit).toBe("test123");
    expect(buildInfo.repositoryUrl).toBe("https://github.com/example/miam");
  });

  it("formats valid deployment dates and rejects invalid values", () => {
    expect(formatDeploymentDate("2026-07-13T18:00:00.000Z", "en")).toMatch(/Jul 13, 2026/);
    expect(formatDeploymentDate("invalid", "en")).toBeNull();
    expect(formatDeploymentDate(null, "en")).toBeNull();
  });
});

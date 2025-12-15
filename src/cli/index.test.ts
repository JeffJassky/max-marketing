import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("glob", () => ({ glob: vi.fn() }));

const importRun = vi.fn();
const entityRun = vi.fn();
const signalRun = vi.fn();

vi.mock("../shared/vendors/windsor/windsorPresetExecutor", () => ({
  WindsorImportExecutor: vi.fn(() => ({ run: importRun })),
}));

vi.mock("../shared/data/entityExecutor", () => ({
  EntityExecutor: vi.fn((projectId: string) => ({
    projectId,
    run: entityRun,
  })),
}));

vi.mock("../shared/data/signalExecutor", () => ({
  SignalExecutor: vi.fn((projectId: string) => ({
    projectId,
    run: signalRun,
  })),
}));

// Import after mocks
import { discoverJobs, executeJob, loadJobFromFilePath } from "./index";
import { glob } from "glob";

const importPath = path.resolve(
  "src/jobs/imports/google_ads/core-keyword-performance.import.ts"
);
const entityPath = path.resolve(
  "src/jobs/entities/keyword-daily/keyword-daily.entity.ts"
);
const signalPath = path.resolve(
  "src/jobs/entities/keyword-daily/signals/wasted-spend-keyword.signal.ts"
);

afterEach(() => {
  vi.clearAllMocks();
});

describe("CLI job loader", () => {
  it("loads real jobs from file paths", async () => {
    const importJob = await loadJobFromFilePath(importPath);
    const entityJob = await loadJobFromFilePath(entityPath);
    const signalJob = await loadJobFromFilePath(signalPath);

    expect(importJob.type).toBe("import");
    expect(entityJob.type).toBe("entity");
    expect(signalJob.type).toBe("signal");

    expect(importJob.id).toBe("coreKeywordPerformance");
    expect(entityJob.id).toBe("keywordDaily");
    expect(signalJob.id).toBe("wastedSpendKeyword");
  });

  it("discovers and sorts jobs via glob patterns", async () => {
    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      signalPath,
    ]);
    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      importPath,
    ]);
    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      entityPath,
    ]);

    const jobs = await discoverJobs();
    const ids = jobs.map((job) => job.id);

    expect(ids).toEqual([
      "coreKeywordPerformance",
      "keywordDaily",
      "wastedSpendKeyword",
    ]);
  });
});

describe("CLI job executor", () => {
  it("executes import jobs with the Windsor executor", async () => {
    const job = await loadJobFromFilePath(importPath);
    await executeJob(job);

    expect(importRun).toHaveBeenCalledTimes(1);
    expect(importRun).toHaveBeenCalledWith(job.instance);
  });

  it("requires a project id for entity jobs", async () => {
    const job = await loadJobFromFilePath(entityPath);
    await expect(executeJob(job)).rejects.toThrow("BIGQUERY_PROJECT");
    await executeJob(job, "my-project");

    expect(entityRun).toHaveBeenCalledTimes(1);
    expect(entityRun).toHaveBeenCalledWith(job.instance);
  });

  it("requires a project id for signal jobs", async () => {
    const job = await loadJobFromFilePath(signalPath);
    await expect(executeJob(job)).rejects.toThrow("BIGQUERY_PROJECT");
    await executeJob(job, "my-project");

    expect(signalRun).toHaveBeenCalledTimes(1);
    expect(signalRun).toHaveBeenCalledWith(job.instance);
  });
});

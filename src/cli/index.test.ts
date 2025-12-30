import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("glob", () => ({ glob: vi.fn() }));

const importRun = vi.fn();
const entityRun = vi.fn();
const aggregateReportRun = vi.fn();
const monitorRun = vi.fn();

vi.mock("../shared/vendors/windsor/windsorPresetExecutor", () => ({
  WindsorImportExecutor: class {
    run = importRun;
  },
}));

vi.mock("../shared/data/entityExecutor", () => ({
  EntityExecutor: class {
    constructor(public projectId: string) {}
    run = entityRun;
  },
}));

vi.mock("../shared/data/aggregateReportExecutor", () => ({
  AggregateReportExecutor: class {
    constructor(public projectId: string) {}
    run = aggregateReportRun;
  },
}));

vi.mock("../shared/data/monitorExecutor", () => ({
  MonitorExecutor: class {
    constructor(public projectId: string) {}
    run = monitorRun;
  },
}));

// Import after mocks
import { discoverJobs, executeJob, loadJobsFromFilePath } from "./index";
import { glob } from "glob";

const importPath = path.resolve(
  "src/jobs/imports/google_ads/core-keyword-performance.import.ts"
);
const entityPath = path.resolve(
  "src/jobs/entities/keyword-daily/keyword-daily.entity.ts"
);
const aggregateReportPath = path.resolve(
  "src/jobs/entities/keyword-daily/aggregateReports/wasted-spend-keyword.aggregateReport.ts"
);

afterEach(() => {
  vi.clearAllMocks();
});

describe("CLI job loader", () => {
  it("loads real jobs from file paths", async () => {
    const [importJob] = await loadJobsFromFilePath(importPath);
    const [entityJob] = await loadJobsFromFilePath(entityPath);
    const [aggregateReportJob] = await loadJobsFromFilePath(
      aggregateReportPath
    );

    expect(importJob.type).toBe("import");
    expect(entityJob.type).toBe("entity");
    expect(aggregateReportJob.type).toBe("aggregateReport");

    expect(importJob.id).toBe("coreKeywordPerformance");
    expect(entityJob.id).toBe("keywordDaily");
    expect(aggregateReportJob.id).toBe("wastedSpendKeyword");
  });

  it("discovers and sorts jobs via glob patterns", async () => {
    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      importPath,
    ]);
    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      entityPath,
    ]);
    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      aggregateReportPath,
    ]);
    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]); // Monitor pattern

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
    const [job] = await loadJobsFromFilePath(importPath);
    await executeJob(job);

    expect(importRun).toHaveBeenCalledTimes(1);
    expect(importRun).toHaveBeenCalledWith(job.instance);
  });

  it("requires a project id for entity jobs", async () => {
    const [job] = await loadJobsFromFilePath(entityPath);
    await expect(executeJob(job)).rejects.toThrow("BIGQUERY_PROJECT");
    await executeJob(job, "my-project");

    expect(entityRun).toHaveBeenCalledTimes(1);
    expect(entityRun).toHaveBeenCalledWith(job.instance);
  });

  it("requires a project id for aggregateReport jobs", async () => {
    const [job] = await loadJobsFromFilePath(aggregateReportPath);
    await expect(executeJob(job)).rejects.toThrow("BIGQUERY_PROJECT");
    await executeJob(job, "my-project");

    expect(aggregateReportRun).toHaveBeenCalledTimes(1);
    expect(aggregateReportRun).toHaveBeenCalledWith(job.instance);
  });
});

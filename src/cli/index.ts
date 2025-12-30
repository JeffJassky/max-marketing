import chalk from "chalk";
import { config as loadEnv } from "dotenv";
import { glob } from "glob";
import inquirer from "inquirer";
import path from "path";
import { pathToFileURL } from "url";
import { VError } from "verror";

import { BronzeImport, Entity, AggregateReport } from "../jobs/base";
import { EntityExecutor } from "../shared/data/entityExecutor";
import { AggregateReportExecutor } from "../shared/data/aggregateReportExecutor";
import { MonitorExecutor } from "../shared/data/monitorExecutor";
import { Monitor } from "../shared/data/monitor";
import { WindsorImportExecutor } from "../shared/vendors/windsor/windsorPresetExecutor";

loadEnv();

type JobType = "import" | "entity" | "aggregateReport" | "monitor";
type JobInstance =
  | BronzeImport<any, any>
  | Entity<any>
  | AggregateReport<any>
  | Monitor;

export type LoadedJob = {
  id: string;
  type: JobType;
  filePath: string;
  instance: JobInstance;
};

const JOB_PATTERNS = [
  "src/jobs/**/*.import.ts",
  "src/jobs/**/*.entity.ts",
  "src/jobs/**/*.aggregateReport.ts",
  "src/jobs/**/*.monitor.ts",
];

const GLOB_OPTIONS = {
  cwd: process.cwd(),
  ignore: ["src/jobs/__tests__/**", "src/jobs/**/__fixtures__/**"],
};

const isJobInstance = (value: unknown): value is JobInstance =>
  value instanceof BronzeImport ||
  value instanceof Entity ||
  value instanceof AggregateReport ||
  value instanceof Monitor;

const getJobTypeFromInstance = (instance: JobInstance): JobType => {
  if (instance instanceof BronzeImport) return "import";
  if (instance instanceof Entity) return "entity";
  if (instance instanceof AggregateReport) return "aggregateReport";
  if (instance instanceof Monitor) return "monitor";
  throw new VError("Unsupported job instance type");
};

export const loadJobsFromFilePath = async (
  filePath: string
): Promise<LoadedJob[]> => {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  const moduleUrl = pathToFileURL(absolutePath).href;
  const moduleExports = await import(moduleUrl);
  const jobInstances = Object.values(moduleExports).filter(isJobInstance);

  if (jobInstances.length === 0) {
    // Warn but don't fail, or just return empty?
    // Existing logic threw error. Let's return empty to be safe, or throw if strict.
    // Given usage, let's return empty if it's just a helper file, but likely we want to know.
    // For now, let's return empty.
    return [];
  }

  return jobInstances.map((jobInstance) => ({
    id: jobInstance.id,
    type: getJobTypeFromInstance(jobInstance),
    filePath: absolutePath,
    instance: jobInstance,
  }));
};

export const discoverJobs = async (): Promise<LoadedJob[]> => {
  const matches = (
    await Promise.all(
      JOB_PATTERNS.map((pattern) => glob(pattern, GLOB_OPTIONS))
    )
  ).flat();

  const nestedJobs = await Promise.all(
    matches.map((match) => loadJobsFromFilePath(match))
  );

  const jobs = nestedJobs.flat();

  const typeOrder: Record<JobType, number> = {
    import: 0,
    entity: 1,
    aggregateReport: 2,
    monitor: 3,
  };

  return jobs.sort((a, b) => {
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;
    return a.id.localeCompare(b.id);
  });
};

const promptForJobs = async (jobs: LoadedJob[]): Promise<LoadedJob[]> => {
  if (!jobs.length) {
    console.log(chalk.yellow("No jobs found under src/jobs."));
    return [];
  }

  const typeLabels: Record<JobType, string> = {
    import: "Imports",
    entity: "Entities",
    aggregateReport: "AggregateReports",
    monitor: "Monitors",
  };

  const groupedChoices = (
    ["import", "entity", "aggregateReport", "monitor"] as JobType[]
  ).flatMap((type) => {
    const groupJobs = jobs.filter((job) => job.type === type);
    if (!groupJobs.length) return [];
    return [
      new inquirer.Separator(typeLabels[type]),
      {
        name: chalk.cyan(`  [ SELECT ALL ${typeLabels[type].toUpperCase()} ]`),
        value: `all:${type}`,
      },
      ...groupJobs.map((job) => ({
        name:
          job.type === "import"
            ? `  ${
                (job.instance as BronzeImport<any, any>).definition.platform ??
                "unknown"
              } / ${job.id} (${job.type})`
            : `  ${job.id} (${job.type})`,
        value: job,
      })),
    ];
  });

  const { selectedValues } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedValues",
      message: "Select jobs to run",
      choices: groupedChoices,
      pageSize: 20,
    },
  ]);

  const finalJobs: LoadedJob[] = [];
  const selectAllTypes = new Set<string>();

  selectedValues.forEach((val: any) => {
    if (typeof val === "string" && val.startsWith("all:")) {
      selectAllTypes.add(val.replace("all:", ""));
    } else {
      finalJobs.push(val);
    }
  });

  if (selectAllTypes.size > 0) {
    jobs.forEach((job) => {
      if (selectAllTypes.has(job.type)) {
        if (
          !finalJobs.find((fj) => fj.id === job.id && fj.type === job.type)
        ) {
          finalJobs.push(job);
        }
      }
    });
  }

  // Deduplicate and Sort
  const typeOrder: Record<JobType, number> = {
    import: 0,
    entity: 1,
    aggregateReport: 2,
    monitor: 3,
  };

  return finalJobs.sort((a, b) => {
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;
    return a.id.localeCompare(b.id);
  });
};

const resolveProjectId = async (
  needsProjectId: boolean
): Promise<string | undefined> => {
  if (!needsProjectId) {
    return undefined;
  }

  if (process.env.BIGQUERY_PROJECT) {
    return process.env.BIGQUERY_PROJECT;
  }

  const { projectId } = await inquirer.prompt([
    {
      type: "input",
      name: "projectId",
      message: "Enter your BigQuery project ID",
      validate: (input: string) =>
        input && input.trim().length > 0
          ? true
          : "Project ID is required for entity/aggregateReport jobs",
    },
  ]);

  return projectId;
};

export const executeJob = async (
  job: LoadedJob,
  projectId?: string
): Promise<void> => {
  console.log(chalk.blue(`Running job: ${job.id} (${job.type})`));

  try {
    switch (job.type) {
      case "import": {
        const executor = new WindsorImportExecutor();
        await executor.run(job.instance as BronzeImport<any, any>);
        break;
      }
      case "entity": {
        if (!projectId) {
          throw new VError("BIGQUERY_PROJECT is required to run entity jobs.");
        }
        const executor = new EntityExecutor(projectId);
        await executor.run(job.instance as Entity<any>);
        break;
      }
      case "aggregateReport": {
        if (!projectId) {
          throw new VError(
            "BIGQUERY_PROJECT is required to run aggregateReport jobs."
          );
        }
        const executor = new AggregateReportExecutor(projectId);
        await executor.run(job.instance as AggregateReport<any>);
        break;
      }
      case "monitor": {
        if (!projectId) {
          throw new VError("BIGQUERY_PROJECT is required to run monitor jobs.");
        }
        const executor = new MonitorExecutor(projectId);
        const instance = job.instance as Monitor;
        // Run Monitor: definition, measure, entity
        await executor.run(
          instance.definition,
          instance.measure,
          instance.entity as Entity<any>
        );
        break;
      }
      default:
        throw new VError(`Unsupported job type: ${job.type}`);
    }

    console.log(chalk.green(`Successfully ran job: ${job.id}`));
  } catch (error: any) {
    const message = error?.message ?? "Unknown error";
    console.log(chalk.red(`Failed to run job: ${job.id}, error: ${message}`));
    if (error?.stack) {
      console.error(chalk.red(error.stack));
    }
    throw error;
  }
};

export const runCli = async (): Promise<void> => {
  const jobs = await discoverJobs();
  const selectedJobs = await promptForJobs(jobs);

  if (!selectedJobs.length) {
    console.log(chalk.yellow("No jobs selected. Exiting."));
    return;
  }

  const needsProjectId = selectedJobs.some((job) => job.type !== "import");
  const projectId = await resolveProjectId(needsProjectId);

  for (const job of selectedJobs) {
    await executeJob(job, projectId);
  }
};

if (process.env.NODE_ENV !== "test") {
  runCli().catch((error) => {
    console.error(chalk.red(error instanceof Error ? error.message : error));
    process.exitCode = 1;
  });
}

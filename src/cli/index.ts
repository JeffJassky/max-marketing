import chalk from "chalk";
import { config as loadEnv } from "dotenv";
import { glob } from "glob";
import inquirer from "inquirer";
import path from "path";
import { pathToFileURL } from "url";
import { VError } from "verror";

import { BronzeImport, Entity, Signal } from "../jobs/base";
import { EntityExecutor } from "../shared/data/entityExecutor";
import { SignalExecutor } from "../shared/data/signalExecutor";
import { WindsorImportExecutor } from "../shared/vendors/windsor/windsorPresetExecutor";

loadEnv();

type JobType = "import" | "entity" | "signal";
type JobInstance = BronzeImport<any> | Entity<any> | Signal<any>;

export type LoadedJob = {
  id: string;
  type: JobType;
  filePath: string;
  instance: JobInstance;
};

const JOB_PATTERNS = [
  "src/jobs/**/*.import.ts",
  "src/jobs/**/*.entity.ts",
  "src/jobs/**/*.signal.ts",
];

const GLOB_OPTIONS = {
  cwd: process.cwd(),
  ignore: ["src/jobs/__tests__/**", "src/jobs/**/__fixtures__/**"],
};

const isJobInstance = (value: unknown): value is JobInstance =>
  value instanceof BronzeImport ||
  value instanceof Entity ||
  value instanceof Signal;

const getJobTypeFromInstance = (instance: JobInstance): JobType => {
  if (instance instanceof BronzeImport) return "import";
  if (instance instanceof Entity) return "entity";
  if (instance instanceof Signal) return "signal";
  throw new VError("Unsupported job instance type");
};

export const loadJobFromFilePath = async (
  filePath: string
): Promise<LoadedJob> => {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  const moduleUrl = pathToFileURL(absolutePath).href;
  const moduleExports = await import(moduleUrl);
  const jobInstance = Object.values(moduleExports).find(isJobInstance);

  if (!jobInstance) {
    throw new VError(`Could not find a job export in file: ${filePath}`);
  }

  return {
    id: jobInstance.id,
    type: getJobTypeFromInstance(jobInstance),
    filePath: absolutePath,
    instance: jobInstance,
  };
};

export const discoverJobs = async (): Promise<LoadedJob[]> => {
  const matches = (
    await Promise.all(JOB_PATTERNS.map((pattern) => glob(pattern, GLOB_OPTIONS)))
  ).flat();

  const jobs: LoadedJob[] = [];
  for (const match of matches) {
    jobs.push(await loadJobFromFilePath(match));
  }

  const typeOrder: Record<JobType, number> = {
    import: 0,
    entity: 1,
    signal: 2,
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
    signal: "Signals",
  };

  const groupedChoices = (["import", "entity", "signal"] as JobType[]).flatMap(
    (type) => {
      const groupJobs = jobs.filter((job) => job.type === type);
      if (!groupJobs.length) return [];
      return [
        new inquirer.Separator(typeLabels[type]),
        ...groupJobs.map((job) => ({
          name:
            job.type === "import"
              ? `${(job.instance as BronzeImport<any>).definition.platform ?? "unknown"} / ${job.id} (${job.type})`
              : `${job.id} (${job.type})`,
          value: job,
        })),
      ];
    }
  );

  const { selectedJobs } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedJobs",
      message: "Select jobs to run",
      choices: groupedChoices,
    },
  ]);

  return selectedJobs as LoadedJob[];
};

const resolveProjectId = async (
  needsProjectId: boolean
): Promise<string | undefined> => {
  if (!needsProjectId) {
    return undefined;
  }

  if (process.env.BIGQUERY_PROJECT_ID) {
    return process.env.BIGQUERY_PROJECT_ID;
  }

  const { projectId } = await inquirer.prompt([
    {
      type: "input",
      name: "projectId",
      message: "Enter your BigQuery project ID",
      validate: (input: string) =>
        input && input.trim().length > 0
          ? true
          : "Project ID is required for entity/signal jobs",
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
        await executor.run(job.instance as BronzeImport<any>);
        break;
      }
      case "entity": {
        if (!projectId) {
          throw new VError("BIGQUERY_PROJECT_ID is required to run entity jobs.");
        }
        const executor = new EntityExecutor(projectId);
        await executor.run(job.instance as Entity<any>);
        break;
      }
      case "signal": {
        if (!projectId) {
          throw new VError("BIGQUERY_PROJECT_ID is required to run signal jobs.");
        }
        const executor = new SignalExecutor(projectId);
        await executor.run(job.instance as Signal<any>);
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

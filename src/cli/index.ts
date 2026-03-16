import chalk from "chalk";
import { config as loadEnv } from "dotenv";
import { glob } from "glob";
import inquirer from "inquirer";
import path from "path";
import { VError } from "verror";

import { BronzeImport, Entity, AggregateReport } from "../jobs/base";
import { EntityExecutor } from "../shared/data/entityExecutor";
import { AggregateReportExecutor } from "../shared/data/aggregateReportExecutor";
import { MonitorExecutor } from "../shared/data/monitorExecutor";
import { SuperlativeExecutor } from "../shared/data/superlativeExecutor";
import { Monitor } from "../shared/data/monitor";
import { WindsorImportExecutor } from "../shared/vendors/windsor/windsorPresetExecutor";
import { runPipeline } from "../queue/pipeline";
import type { LookbackPreset } from "../queue/types";

loadEnv();

type JobType = "import" | "entity" | "aggregateReport" | "monitor" | "superlative";
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

const isCompiledRuntime = __filename.endsWith(".js");
const jobRoot = isCompiledRuntime ? "dist/jobs" : "src/jobs";
const jobExt = isCompiledRuntime ? ".js" : ".ts";

const JOB_PATTERNS = [
  `${jobRoot}/**/*.import${jobExt}`,
  `${jobRoot}/**/*.entity${jobExt}`,
  `${jobRoot}/**/*.aggregateReport${jobExt}`,
  `${jobRoot}/**/*.monitor${jobExt}`,
];

const GLOB_OPTIONS = {
  cwd: process.cwd(),
  ignore: [`${jobRoot}/__tests__/**`, `${jobRoot}/**/__fixtures__/**`],
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

  const moduleExports = await import(absolutePath);
  const jobInstances = Object.values(moduleExports).filter(isJobInstance);

  if (jobInstances.length === 0) {
    return [];
  }

  const jobs: LoadedJob[] = [];

  for (const jobInstance of jobInstances) {
    const primaryType = getJobTypeFromInstance(jobInstance);
    
    // Add the primary job
    jobs.push({
      id: jobInstance.id,
      type: primaryType,
      filePath: absolutePath,
      instance: jobInstance,
    });

    // CHECK FOR SUPERLATIVES
    // If it's an entity and has a superlative config, add a separate "superlative" job
    if (primaryType === "entity" && (jobInstance as Entity<any>).definition.superlatives?.length) {
      jobs.push({
        id: `${jobInstance.id}_superlatives`, // Distinct ID
        type: "superlative",
        filePath: absolutePath,
        instance: jobInstance, // We reuse the entity instance
      });
    }
  }

  return jobs;
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
    superlative: 4,
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
    superlative: "Superlatives",
  };

  const groupedChoices = (
    ["import", "entity", "aggregateReport", "monitor", "superlative"] as JobType[]
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
    superlative: 4,
  };

  return finalJobs.sort((a, b) => {
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;
    return a.id.localeCompare(b.id);
  });
};

const resolveProjectId = async (
  needsProjectId: boolean,
  passedProjectId?: string
): Promise<string | undefined> => {
  if (!needsProjectId) {
    return undefined;
  }

  if (passedProjectId) {
    return passedProjectId;
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
      case "superlative": {
        if (!projectId) {
          throw new VError("BIGQUERY_PROJECT is required to run superlative jobs.");
        }
        const executor = new SuperlativeExecutor(projectId);
        // Run for the last 3 months
        await executor.run([job.instance as Entity<any>], { 
          lookbackMonths: 3
        });
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

const parseArgs = () => {
  const args = process.argv.slice(2);
  const selected = {
    import: new Set<string>(),
    entity: new Set<string>(),
    aggregateReport: new Set<string>(),
    monitor: new Set<string>(),
    superlative: new Set<string>(),
    allImports: false,
    allEntities: false,
    allAggregateReports: false,
    allMonitors: false,
    allSuperlatives: false,
    thumbnail: false,
    all: false,
    projectId: undefined as string | undefined,
    lookback: undefined as LookbackPreset | undefined,
    enqueue: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case "--help":
      case "-h":
        selected.help = true;
        break;
      case "--project":
        if (args[i + 1]) selected.projectId = args[++i];
        break;
      case "--import":
        if (args[i + 1]) selected.import.add(args[++i]);
        break;
      case "--entity":
        if (args[i + 1]) selected.entity.add(args[++i]);
        break;
      case "--report":
        if (args[i + 1]) selected.aggregateReport.add(args[++i]);
        break;
      case "--monitor":
        if (args[i + 1]) selected.monitor.add(args[++i]);
        break;
      case "--superlative":
        if (args[i + 1]) selected.superlative.add(args[++i]);
        break;
      case "--all-imports":
        selected.allImports = true;
        break;
      case "--all-entities":
        selected.allEntities = true;
        break;
      case "--all-reports":
        selected.allAggregateReports = true;
        break;
      case "--all-monitors":
        selected.allMonitors = true;
        break;
      case "--all-superlatives":
        selected.allSuperlatives = true;
        break;
      case "--thumbnail":
        selected.thumbnail = true;
        break;
      case "--all":
        selected.all = true;
        break;
      case "--lookback":
        if (args[i + 1]) selected.lookback = args[++i] as LookbackPreset;
        break;
      case "--enqueue":
        selected.enqueue = true;
        break;
    }
  }

  const hasSelection = 
    selected.import.size > 0 ||
    selected.entity.size > 0 ||
    selected.aggregateReport.size > 0 ||
    selected.monitor.size > 0 ||
    selected.superlative.size > 0 ||
    selected.allImports ||
    selected.allEntities ||
    selected.allAggregateReports ||
    selected.allMonitors ||
    selected.allSuperlatives ||
    selected.thumbnail ||
    selected.all;

  return { selected, hasSelection };
};

export const runCli = async (): Promise<void> => {
  const { selected, hasSelection } = parseArgs();

  if (selected.help) {
    console.log(`
Usage: cli [options]

Options:
  --project <id>       BigQuery Project ID
  --import <id>        Run specific import
  --entity <id>        Run specific entity
  --report <id>        Run specific aggregate report
  --monitor <id>       Run specific monitor
  --superlative <id>   Run specific superlative
  --thumbnail          Run thumbnail S3 sync
  --all-imports        Run all imports
  --all-entities       Run all entities
  --all-reports        Run all aggregate reports
  --all-monitors       Run all monitors
  --all-superlatives   Run all superlatives
  --all                Run everything
  --lookback <preset>  Override import date range (3d, 7d, 14d, 30d, 90d)
  --enqueue            Push job to BullMQ queue instead of running inline
    `);
    return;
  }

  // Default lookback for thumbnail-only runs (thumbnail sync uses its own lookbackDays config)
  if (selected.thumbnail && !selected.lookback) {
    selected.lookback = "7d" as LookbackPreset;
  }

  // If --lookback is provided, use the pipeline runner so date_preset is respected
  if (selected.lookback && hasSelection) {
    const phases: ("import" | "thumbnail" | "entity" | "aggregateReport" | "monitor" | "superlative")[] = [];
    const jobIds: string[] = [];

    if (selected.all) {
      phases.push("import", "entity", "thumbnail", "aggregateReport", "monitor", "superlative");
    } else {
      if (selected.allImports || selected.import.size > 0) phases.push("import");
      if (selected.allEntities || selected.entity.size > 0) phases.push("entity");
      if (selected.thumbnail) phases.push("thumbnail");
      if (selected.allAggregateReports || selected.aggregateReport.size > 0) phases.push("aggregateReport");
      if (selected.allMonitors || selected.monitor.size > 0) phases.push("monitor");
      if (selected.allSuperlatives || selected.superlative.size > 0) phases.push("superlative");
    }

    // Collect specific job IDs (pipeline will filter to these)
    if (!selected.all) {
      for (const id of selected.import) jobIds.push(id);
      for (const id of selected.entity) jobIds.push(id);
      for (const id of selected.aggregateReport) jobIds.push(id);
      for (const id of selected.monitor) jobIds.push(id);
      for (const id of selected.superlative) jobIds.push(id);
    }

    if (selected.enqueue) {
      const { enqueuePipeline } = await import("../queue/enqueue");
      const jobId = await enqueuePipeline({
        lookback: selected.lookback,
        phase: selected.all ? "full" : phases[0],
      });
      console.log(chalk.green(`Enqueued pipeline job: ${jobId}`));
      return;
    }

    await runPipeline({
      lookback: selected.lookback,
      phases,
      jobIds: jobIds.length > 0 ? jobIds : undefined,
    });
    return;
  }

  // If --enqueue is used with --all (no lookback specified), default to 7d
  if (selected.enqueue && selected.all) {
    const { enqueuePipeline } = await import("../queue/enqueue");
    const jobId = await enqueuePipeline({
      lookback: selected.lookback || "7d",
      phase: "full",
    });
    console.log(chalk.green(`Enqueued pipeline job: ${jobId}`));
    return;
  }

  const jobs = await discoverJobs();
  let selectedJobs: LoadedJob[] = [];

  if (hasSelection) {
    // Filter jobs based on flags
    selectedJobs = jobs.filter((job) => {
      if (selected.all) return true;

      if (job.type === "import") {
        return selected.allImports || selected.import.has(job.id);
      }
      if (job.type === "entity") {
        return selected.allEntities || selected.entity.has(job.id);
      }
      if (job.type === "aggregateReport") {
        return selected.allAggregateReports || selected.aggregateReport.has(job.id);
      }
      if (job.type === "monitor") {
        return selected.allMonitors || selected.monitor.has(job.id);
      }
      if (job.type === "superlative") {
        return selected.allSuperlatives || selected.superlative.has(job.id);
      }
      return false;
    });

    if (selectedJobs.length === 0) {
      console.log(chalk.yellow("No jobs matched the provided arguments."));
      return;
    }

  } else {
    // Interactive mode
    selectedJobs = await promptForJobs(jobs);
  }

  if (!selectedJobs.length) {
    console.log(chalk.yellow("No jobs selected. Exiting."));
    return;
  }

  const needsProjectId = selectedJobs.some((job) => job.type !== "import");
  const projectId = await resolveProjectId(needsProjectId, selected.projectId);

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

import { z } from "zod";
import YAML from "yaml";

const TriggerSchema = z
  .object({
    TriggerSourceContract: z.string().optional(),
    TriggerChainID: z.number().optional(),
    TriggerEventName: z.string().optional(),
    TriggerEventFilter: z.string().optional(),
    TriggerSourceContractABI: z.string().optional(),
    RecurringSourceContract: z.string().optional(),
    RecurringChainID: z.number().optional(),
    RecurringEventName: z.string().optional(),
    RecurringEventFilter: z.string().optional(),
    RecurringSourceContractABI: z.string().optional(),
    ExecuteAfter: z.union([z.string(), z.number()]),
    RepeatEvery: z.union([z.string(), z.number()]),
    ExpiresIn: z.union([z.string(), z.number()]).optional(),
    TriggerPrice: z.number().optional(),
    RecurringPrice: z.number().optional(),
    Meta: z.string().optional(),
    ActionStatusNotificationPOSTURL: z.string().optional(),
    ActionStatusNotificationAPIKey: z.string().optional(),
  })
  .passthrough();

const CallActionSchema = z.object({
  Name: z.string(),
  Type: z.literal("call"),
  TargetContract: z.string(),
  TargetFunction: z.string(),
  TargetParams: z.array(z.union([z.string(), z.number()])),
  ChainID: z.number(),
  EncodedABI: z.string().default("NA"),
  Metadata: z.string().default("NA"),
  RetriesUntilSuccess: z.number().default(3),
});

const PostActionSchema = z.object({
  Name: z.string(),
  Type: z.enum(["post", "api"]),
  APIEndpoint: z.string(),
  APIPayload: z.record(z.string(), z.unknown()),
  RetriesUntilSuccess: z.number().default(3),
});

const DeployActionSchema = z.object({
  Name: z.string(),
  Type: z.literal("deploy"),
  Bytecode: z.string(),
  EncodedABI: z.string().optional(),
  InitializationArgs: z.array(z.string()).optional(),
  ChainID: z.number(),
  RetriesUntilSuccess: z.number().default(3),
});

const ActionSchema = z.union([
  CallActionSchema,
  PostActionSchema,
  DeployActionSchema,
]);

const WorkflowSchema = z.object({
  Name: z.string().min(1),
  Trigger: TriggerSchema,
  Actions: z.array(ActionSchema).min(1).max(10),
  Execution: z.object({ Mode: z.enum(["sequential", "parallel"]) }),
});

export type KwalangWorkflow = z.infer<typeof WorkflowSchema>;

export function validateWorkflow(yamlString: string): {
  valid: boolean;
  errors?: string[];
  parsed?: KwalangWorkflow;
} {
  try {
    const parsed = YAML.parse(yamlString);
    const result = WorkflowSchema.safeParse(parsed);
    if (result.success) {
      return { valid: true, parsed: result.data };
    }
    return {
      valid: false,
      errors: result.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      ),
    };
  } catch (e) {
    return {
      valid: false,
      errors: [`YAML parse error: ${e instanceof Error ? e.message : String(e)}`],
    };
  }
}

export { WorkflowSchema, TriggerSchema, ActionSchema };

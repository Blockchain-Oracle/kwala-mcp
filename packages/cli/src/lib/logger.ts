import pino from "pino";

export const logger = pino(
  { name: "kwala-ai", level: process.env.LOG_LEVEL ?? "info" },
  pino.destination(2),
);

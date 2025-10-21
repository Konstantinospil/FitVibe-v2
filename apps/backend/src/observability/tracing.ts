import { diag, DiagConsoleLogger, DiagLogLevel, type DiagLogger } from "@opentelemetry/api";

const consoleLogger: DiagLogger = new DiagConsoleLogger();
diag.setLogger(consoleLogger, DiagLogLevel.INFO);

export function initializeTracing(): void {
  // TODO: wire OpenTelemetry SDK
}

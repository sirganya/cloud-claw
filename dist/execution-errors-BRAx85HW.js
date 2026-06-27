//#region src/agents/embedded-agent-runner/execution-phase.ts
const EMBEDDED_AGENT_EXECUTION_PHASE_LABELS = {
	runner_entered: "runner-entered",
	workspace: "workspace",
	runtime_plugins: "runtime-plugins",
	before_agent_reply: "before-agent-reply",
	model_resolution: "model-resolution",
	auth: "auth",
	context_engine: "context-engine",
	attempt_dispatch: "attempt-dispatch",
	context_assembled: "context-assembled",
	turn_accepted: "turn-accepted",
	process_spawned: "process-spawned",
	tool_execution_started: "tool-execution-started",
	assistant_output_started: "assistant-output-started",
	model_call_started: "model-call-started"
};
/** Converts an internal phase id into the compact label used in status output. */
function formatEmbeddedAgentExecutionPhase(phase) {
	return phase ? EMBEDDED_AGENT_EXECUTION_PHASE_LABELS[phase] : void 0;
}
//#endregion
//#region src/cron/service/execution-errors.ts
/** Formats stable cron timeout and execution error messages. */
function formatCronAgentExecutionPhase(execution) {
	return formatEmbeddedAgentExecutionPhase(execution?.phase);
}
/** Formats the generic cron execution timeout message with last-known phase context when available. */
function timeoutErrorMessage(execution) {
	const phase = formatCronAgentExecutionPhase(execution);
	if (!phase) return "cron: job execution timed out";
	return `cron: job execution timed out (last phase: ${phase})`;
}
/** Formats timeout text for runs that stalled before the isolated runner started. */
function setupTimeoutErrorMessage(execution) {
	const phase = formatCronAgentExecutionPhase(execution);
	if (!phase) return "cron: isolated agent setup timed out before runner start";
	return `cron: isolated agent setup timed out before runner start (last phase: ${phase})`;
}
/** Returns true for the setup-timeout class that fires before the isolated runner starts. */
function isSetupTimeoutErrorText(error) {
	return error.startsWith("cron: isolated agent setup timed out before runner start");
}
/** Formats timeout text for runs that stalled after setup but before execution start. */
function preExecutionTimeoutErrorMessage(execution) {
	const phase = formatCronAgentExecutionPhase(execution);
	if (!phase) return "cron: isolated agent run stalled before execution start";
	return `cron: isolated agent run stalled before execution start (last phase: ${phase})`;
}
/** Extracts a human timeout/abort reason, falling back to the canonical cron timeout text. */
function resolveCronAbortReasonText(reason) {
	if (typeof reason === "string" && reason.trim()) return reason.trim();
	if (reason instanceof Error && reason.message.trim()) return reason.message.trim();
}
/** Extracts a human timeout/abort reason, falling back to the canonical cron timeout text. */
function abortErrorMessage(signal) {
	return resolveCronAbortReasonText(signal?.reason) ?? timeoutErrorMessage();
}
function isAbortError(err) {
	if (!(err instanceof Error)) return false;
	return err.name === "AbortError" || err.message === timeoutErrorMessage();
}
/** Normalizes thrown cron run failures into stable log/run-log text. */
function normalizeCronRunErrorText(err) {
	if (isAbortError(err)) return timeoutErrorMessage();
	if (typeof err === "string") return err === `Error: ${timeoutErrorMessage()}` ? timeoutErrorMessage() : err;
	return String(err);
}
//#endregion
export { resolveCronAbortReasonText as a, preExecutionTimeoutErrorMessage as i, isSetupTimeoutErrorText as n, setupTimeoutErrorMessage as o, normalizeCronRunErrorText as r, timeoutErrorMessage as s, abortErrorMessage as t };

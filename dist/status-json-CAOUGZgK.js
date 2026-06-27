import { t as runStatusJsonCommand } from "./status-json-command-feBPqZM5.js";
import { t as scanStatusJsonFast } from "./status.scan.fast-json-CQCCGJ0L.js";
//#region src/commands/status-json.ts
/** Runs status JSON with the standard fast scan and all-mode security audit behavior. */
async function statusJsonCommand(opts, runtime) {
	await runStatusJsonCommand({
		opts,
		runtime,
		scanStatusJsonFast,
		includeSecurityAudit: opts.all === true,
		suppressHealthErrors: true
	});
}
//#endregion
export { statusJsonCommand };

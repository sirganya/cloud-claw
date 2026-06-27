import { i as OpenClawConfig } from "../../types.openclaw-DYWtNRsb.js";
import { jt as ProviderAuthResult } from "../../types-6kOfVdoQ.js";
import { n as readClaudeCliCredentialsForSetup } from "../../cli-auth-seam-WI4cRpWg.js";
//#region extensions/anthropic/cli-migration.d.ts
type ClaudeCliCredential = NonNullable<ReturnType<typeof readClaudeCliCredentialsForSetup>>;
/** Build the config migration result for adopting Claude CLI-backed Anthropic defaults. */
declare function buildAnthropicCliMigrationResult(config: OpenClawConfig, credential?: ClaudeCliCredential | null): ProviderAuthResult;
//#endregion
export { buildAnthropicCliMigrationResult };
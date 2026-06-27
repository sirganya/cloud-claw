import "./agent-scope-ZuqArM9O.js";
import { a as resolveAgentDir, o as resolveAgentWorkspaceDir } from "./agent-scope-config-DtQ4nTRd.js";
import { n as DEFAULT_MODEL, r as DEFAULT_PROVIDER } from "./defaults-mDjiWzE5.js";
import { _ as updateSessionStore, h as saveSessionStore, v as updateSessionStoreEntry, x as loadSessionStore } from "./store-D6cDx2Ll.js";
import { a as resolveSessionFilePath, d as resolveStorePath } from "./paths-fL1rzuvE.js";
import { t as resolveThinkingDefault } from "./model-thinking-default-BW6WOU39.js";
import "./model-selection-DaIgdnQt.js";
import { d as ensureAgentWorkspace } from "./workspace-BebG2dpv.js";
import { t as resolveAgentTimeoutMs } from "./timeout-Drw0_zOv.js";
import "./sessions-U2wVhWLq.js";
import { n as resolveAgentIdentity } from "./identity-lbCdL3YA.js";
import { t as runEmbeddedAgent } from "./embedded-agent-BZOJItKb.js";
//#region src/extensionAPI.ts
if (process.env.VITEST !== "true" && process.env.OPENCLAW_SUPPRESS_EXTENSION_API_WARNING !== "1") process.emitWarning("openclaw/extension-api is deprecated. Migrate to api.runtime.agent.* or focused openclaw/plugin-sdk/<subpath> imports. See https://docs.openclaw.ai/plugins/sdk-migration", {
	code: "OPENCLAW_EXTENSION_API_DEPRECATED",
	detail: "This compatibility bridge is temporary. Bundled plugins should use the injected plugin runtime instead of importing host-side agent helpers directly. Migration guide: https://docs.openclaw.ai/plugins/sdk-migration"
});
//#endregion
export { DEFAULT_MODEL, DEFAULT_PROVIDER, ensureAgentWorkspace, loadSessionStore, resolveAgentDir, resolveAgentIdentity, resolveAgentTimeoutMs, resolveAgentWorkspaceDir, resolveSessionFilePath, resolveStorePath, resolveThinkingDefault, runEmbeddedAgent, runEmbeddedAgent as runEmbeddedPiAgent, saveSessionStore, updateSessionStore, updateSessionStoreEntry };

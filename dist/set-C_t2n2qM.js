import { i as resolveAgentModelPrimaryValue } from "./model-input-BHKiDwaq.js";
import { r as logConfigUpdated } from "./logging-D9NkqkpC.js";
import { d as updateConfig, t as applyDefaultModelPrimaryUpdate } from "./shared-DrI883RZ.js";
import { r as repairCodexRuntimePluginInstallForModelSelection } from "./codex-runtime-plugin-install-wI1WWX_5.js";
import { r as repairCopilotRuntimePluginInstallForModelSelection } from "./copilot-runtime-plugin-install-C0BF2N0h.js";
//#region src/commands/models/set.ts
/** Command for setting the default text model. */
/** Sets agents.defaults.model.primary and repairs provider runtime plugin installs when needed. */
async function modelsSetCommand(modelRaw, runtime) {
	const updated = await updateConfig((cfg, context) => {
		return applyDefaultModelPrimaryUpdate({
			cfg,
			resolveCfg: context.runtimeConfig,
			modelRaw,
			field: "model"
		});
	});
	const selectedModel = resolveAgentModelPrimaryValue(updated.agents?.defaults?.model) ?? modelRaw;
	const repaired = await repairCodexRuntimePluginInstallForModelSelection({
		cfg: updated,
		model: selectedModel
	});
	const copilotRepaired = await repairCopilotRuntimePluginInstallForModelSelection({
		cfg: updated,
		model: selectedModel
	});
	const warnings = [...repaired.warnings, ...copilotRepaired.warnings];
	for (const warning of warnings) runtime.error?.(warning);
	logConfigUpdated(runtime);
	runtime.log(`Default model: ${selectedModel}`);
}
//#endregion
export { modelsSetCommand };

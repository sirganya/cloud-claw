import { c as isRecord } from "./utils-D2Wwrmfu.js";
import "./agent-scope-ZuqArM9O.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-DtQ4nTRd.js";
import { t as collectPluginConfigContractMatches } from "./config-contract-matches-bFdnvwxq.js";
import { t as resolvePluginConfigContractsById } from "./config-contracts-C7SCOsb0.js";
import { n as collectEnabledInsecureOrDangerousFlagsFromContracts, t as collectEnabledInsecureOrDangerousFlagsFromCurrentSnapshot } from "./dangerous-config-flags-current-DAe4VIkI.js";
//#region src/security/dangerous-config-flags.ts
/**
* Collect enabled insecure/dangerous config flags for audit warnings and gateway tool previews.
* Plugin flags use current metadata when requested, then fall back to resolving manifest contracts.
*/
function collectEnabledInsecureOrDangerousFlags(cfg, options = {}) {
	const pluginEntries = cfg.plugins?.entries;
	if (!isRecord(pluginEntries)) return collectEnabledInsecureOrDangerousFlagsFromContracts(cfg);
	const pluginIds = Object.keys(pluginEntries);
	if (options.preferCurrentPluginMetadataSnapshot) {
		const currentSnapshotFlags = collectEnabledInsecureOrDangerousFlagsFromCurrentSnapshot(cfg);
		if (currentSnapshotFlags) return currentSnapshotFlags;
	}
	return collectEnabledInsecureOrDangerousFlagsFromContracts(cfg, {
		collectPluginConfigContractMatches,
		configContractsById: resolvePluginConfigContractsById({
			config: cfg,
			workspaceDir: resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg)),
			env: process.env,
			pluginIds
		})
	});
}
//#endregion
export { collectEnabledInsecureOrDangerousFlags as t };

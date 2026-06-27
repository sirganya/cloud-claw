import "./agent-scope-ZuqArM9O.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-DtQ4nTRd.js";
import { r as collectUnregisteredConfiguredMemoryEmbeddingProviders } from "./gateway-startup-plugin-ids-dPttGzZo.js";
import { s as listCoreGatewayMethodNames } from "./core-descriptors-B2lASufG.js";
import { t as applyPluginAutoEnable } from "./plugin-auto-enable-Duh-g4ax.js";
import { M as listRegisteredEmbeddingProviders } from "./registry-CwedN2iD.js";
import { D as createEmptyPluginRegistry, E as setActivePluginRegistry, s as getActivePluginRegistry } from "./runtime-Dp1LdtBR.js";
import "./channel-plugin-ids-CPMDggrn.js";
import { n as loadPluginLookUpTable } from "./plugin-lookup-table-C9M5Tg0s.js";
import { l as initSubagentRegistry } from "./subagent-registry-B2eY8bkp.js";
import { t as mergeActivationSectionsIntoRuntimeConfig } from "./plugin-activation-runtime-config-D5mpDPFO.js";
import { n as listGatewayMethods } from "./server-methods-list-BMAKPbLL.js";
//#region src/gateway/server-startup-plugins.ts
/** Returns the config snapshot used by channel/plugin startup maintenance. */
function resolveGatewayStartupMaintenanceConfig(params) {
	return params.cfgAtStart.channels === void 0 && params.startupRuntimeConfig.channels !== void 0 ? {
		...params.cfgAtStart,
		channels: params.startupRuntimeConfig.channels
	} : params.cfgAtStart;
}
/** Builds plugin startup state and gateway method lists before the server binds. */
async function prepareGatewayPluginBootstrap(params) {
	const activationSourceConfig = params.activationSourceConfig ?? params.cfgAtStart;
	const startupMaintenanceConfig = resolveGatewayStartupMaintenanceConfig({
		cfgAtStart: params.cfgAtStart,
		startupRuntimeConfig: params.startupRuntimeConfig
	});
	if (!params.minimalTestGateway || startupMaintenanceConfig.channels !== void 0) {
		const { runChannelPluginStartupMaintenance } = await import("./lifecycle-startup-CMESmHfz.js");
		const startupTasks = [runChannelPluginStartupMaintenance({
			cfg: startupMaintenanceConfig,
			env: process.env,
			log: params.log
		})];
		if (!params.minimalTestGateway) {
			const { runStartupSessionMigration } = await import("./server-startup-session-migration-C2qfKndR.js");
			startupTasks.push(runStartupSessionMigration({
				cfg: params.cfgAtStart,
				env: process.env,
				log: params.log
			}));
		}
		await Promise.all(startupTasks);
	}
	initSubagentRegistry();
	const gatewayPluginConfig = params.minimalTestGateway ? params.cfgAtStart : mergeActivationSectionsIntoRuntimeConfig({
		runtimeConfig: params.cfgAtStart,
		activationConfig: applyPluginAutoEnable({
			config: activationSourceConfig,
			env: process.env,
			...params.pluginMetadataSnapshot?.manifestRegistry ? { manifestRegistry: params.pluginMetadataSnapshot.manifestRegistry } : {},
			discovery: params.pluginMetadataSnapshot?.discovery
		}).config
	});
	const pluginsGloballyDisabled = gatewayPluginConfig.plugins?.enabled === false;
	const defaultWorkspaceDir = resolveAgentWorkspaceDir(gatewayPluginConfig, resolveDefaultAgentId(gatewayPluginConfig));
	const pluginLookUpTable = params.minimalTestGateway || pluginsGloballyDisabled ? void 0 : loadPluginLookUpTable({
		config: gatewayPluginConfig,
		workspaceDir: defaultWorkspaceDir,
		env: process.env,
		activationSourceConfig,
		metadataSnapshot: params.pluginMetadataSnapshot
	});
	const deferredConfiguredChannelPluginIds = [...pluginLookUpTable?.startup.configuredDeferredChannelPluginIds ?? []];
	const startupPluginIds = [...pluginLookUpTable?.startup.pluginIds ?? []];
	const baseMethods = listGatewayMethods();
	const coreGatewayMethodNames = listCoreGatewayMethodNames();
	const emptyPluginRegistry = createEmptyPluginRegistry();
	let pluginRegistry;
	let baseGatewayMethods = baseMethods;
	const shouldLoadRuntimePlugins = params.loadRuntimePlugins !== false;
	const shouldLoadSetupRuntimePlugins = params.loadSetupRuntimePlugins === true && deferredConfiguredChannelPluginIds.length > 0;
	if (!params.minimalTestGateway && shouldLoadSetupRuntimePlugins) ({pluginRegistry, gatewayMethods: baseGatewayMethods} = await loadGatewayStartupPluginRuntime({
		cfg: gatewayPluginConfig,
		activationSourceConfig,
		workspaceDir: defaultWorkspaceDir,
		log: params.log,
		baseMethods,
		coreGatewayMethodNames,
		startupPluginIds: deferredConfiguredChannelPluginIds,
		pluginLookUpTable,
		preferSetupRuntimeForChannelPlugins: true,
		suppressPluginInfoLogs: true
	}));
	else if (!params.minimalTestGateway && shouldLoadRuntimePlugins) ({pluginRegistry, gatewayMethods: baseGatewayMethods} = await loadGatewayStartupPluginRuntime({
		cfg: gatewayPluginConfig,
		activationSourceConfig,
		workspaceDir: defaultWorkspaceDir,
		log: params.log,
		baseMethods,
		coreGatewayMethodNames,
		startupPluginIds,
		pluginLookUpTable,
		preferSetupRuntimeForChannelPlugins: false,
		suppressPluginInfoLogs: false
	}));
	else {
		pluginRegistry = params.minimalTestGateway ? getActivePluginRegistry() ?? emptyPluginRegistry : emptyPluginRegistry;
		setActivePluginRegistry(pluginRegistry);
	}
	const runtimePluginsLoaded = !params.minimalTestGateway && shouldLoadRuntimePlugins && !shouldLoadSetupRuntimePlugins;
	return {
		gatewayPluginConfigAtStart: gatewayPluginConfig,
		defaultWorkspaceDir,
		deferredConfiguredChannelPluginIds,
		startupPluginIds,
		pluginLookUpTable,
		baseMethods,
		pluginRegistry,
		baseGatewayMethods,
		runtimePluginsLoaded
	};
}
/**
* Warn when `agents.*.memorySearch.provider` selects a memory embedding provider
* that no loaded plugin registered. Without the owning plugin, `active-memory`
* cannot embed and silently falls back to keyword/FTS-only recall.
*/
function warnUnregisteredConfiguredMemoryEmbeddingProviders(params) {
	const registeredProviderIds = new Set([
		...params.pluginRegistry.memoryEmbeddingProviders ?? [],
		...params.pluginRegistry.embeddingProviders ?? [],
		...listRegisteredEmbeddingProviders().map((entry) => ({ provider: entry.adapter }))
	].map((entry) => entry.provider.id));
	const unregistered = collectUnregisteredConfiguredMemoryEmbeddingProviders({
		config: params.config,
		registeredProviderIds
	});
	for (const provider of unregistered) {
		const path = `memorySearch.${provider.source}`;
		params.log.warn(`${path}="${provider.configuredId}" is configured, but no loaded plugin registered a memory embedding provider that can serve "${provider.configuredId}". Semantic memory recall will fall back to keyword/FTS-only search. Ensure the plugin that provides "${provider.configuredId}" is installed and enabled.`);
	}
}
/** Loads startup plugin runtimes through the deferred bootstrap boundary. */
async function loadGatewayStartupPluginRuntime(params) {
	const { loadGatewayStartupPlugins } = await import("./server-plugin-bootstrap-CImz9eCh.js");
	const loaded = loadGatewayStartupPlugins({
		cfg: params.cfg,
		activationSourceConfig: params.activationSourceConfig,
		workspaceDir: params.workspaceDir,
		log: params.log,
		coreGatewayMethodNames: params.coreGatewayMethodNames ?? params.baseMethods,
		baseMethods: params.baseMethods,
		...params.hostServices !== void 0 && { hostServices: params.hostServices },
		pluginIds: params.startupPluginIds,
		pluginLookUpTable: params.pluginLookUpTable,
		preferSetupRuntimeForChannelPlugins: params.preferSetupRuntimeForChannelPlugins,
		suppressPluginInfoLogs: params.suppressPluginInfoLogs,
		startupTrace: params.startupTrace
	});
	if (params.preferSetupRuntimeForChannelPlugins !== true) warnUnregisteredConfiguredMemoryEmbeddingProviders({
		config: params.cfg,
		pluginRegistry: loaded.pluginRegistry,
		log: params.log
	});
	return loaded;
}
//#endregion
export { loadGatewayStartupPluginRuntime, prepareGatewayPluginBootstrap, resolveGatewayStartupMaintenanceConfig, warnUnregisteredConfiguredMemoryEmbeddingProviders };

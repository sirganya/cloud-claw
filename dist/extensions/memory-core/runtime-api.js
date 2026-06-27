import { t as getProviderEnvVars } from "../../provider-env-vars-Db4sedUs.js";
import { n as listMemoryEmbeddingProviders } from "../../memory-embedding-provider-runtime-B5NiZpXg.js";
import { n as resolveMemoryFtsState, r as resolveMemoryVectorState, t as resolveMemoryCacheSummary } from "../../status-format-ExS6-yQO.js";
import "../../memory-core-host-status-Y27OU-PZ.js";
import { t as DEFAULT_LOCAL_MODEL } from "../../embedding-defaults-BP3wPc9o.js";
import "../../memory-core-host-embedding-registry-DKkR9sv5.js";
import { t as hasConfiguredMemorySecretInput } from "../../secret-input-CVx0lyPz.js";
import { t as checkQmdBinaryAvailability } from "../../engine-qmd-B3NZYxRt.js";
import "../../memory-core-host-engine-qmd-EuYhIwAV.js";
import "../../provider-env-vars-_S4UZ5en.js";
import { u as configureMemoryCoreDreamingState } from "../../dreaming-state-DLMGVRgZ.js";
import { b as removeGroundedShortTermCandidates, s as auditShortTermPromotionArtifacts, u as loadShortTermPromotionDreamingStats, x as repairShortTermPromotionArtifacts } from "../../short-term-promotion-BXyg0ODu.js";
import { a as createEmbeddingProvider, t as MemoryIndexManager } from "../../manager-DwqxK1Fi.js";
import { r as getMemorySearchManager } from "../../memory-B-zuuv5v.js";
import { t as memoryRuntime } from "../../runtime-provider-wMNkmYa7.js";
import { n as repairDreamingArtifacts, t as auditDreamingArtifacts } from "../../dreaming-repair-m4FFesCg.js";
//#region extensions/memory-core/src/memory/provider-adapters.ts
function getBuiltinMemoryEmbeddingProviderAdapter(id) {
	return listMemoryEmbeddingProviders().find((adapter) => adapter.id === id);
}
function getBuiltinMemoryEmbeddingProviderDoctorMetadata(providerId) {
	const adapter = getBuiltinMemoryEmbeddingProviderAdapter(providerId);
	if (!adapter) return null;
	const authProviderId = adapter.authProviderId ?? adapter.id;
	return {
		providerId: adapter.id,
		authProviderId,
		envVars: getProviderEnvVars(authProviderId),
		transport: adapter.transport === "local" ? "local" : "remote",
		autoSelectPriority: adapter.autoSelectPriority
	};
}
function listBuiltinAutoSelectMemoryEmbeddingProviderDoctorMetadata() {
	return listMemoryEmbeddingProviders().filter((adapter) => typeof adapter.autoSelectPriority === "number").toSorted((a, b) => (a.autoSelectPriority ?? 0) - (b.autoSelectPriority ?? 0)).map((adapter) => {
		const authProviderId = adapter.authProviderId ?? adapter.id;
		return {
			providerId: adapter.id,
			authProviderId,
			envVars: getProviderEnvVars(authProviderId),
			transport: adapter.transport === "local" ? "local" : "remote",
			autoSelectPriority: adapter.autoSelectPriority
		};
	});
}
//#endregion
export { DEFAULT_LOCAL_MODEL, MemoryIndexManager, auditDreamingArtifacts, auditShortTermPromotionArtifacts, checkQmdBinaryAvailability, configureMemoryCoreDreamingState, createEmbeddingProvider, getBuiltinMemoryEmbeddingProviderDoctorMetadata, getMemorySearchManager, hasConfiguredMemorySecretInput, listBuiltinAutoSelectMemoryEmbeddingProviderDoctorMetadata, loadShortTermPromotionDreamingStats, memoryRuntime, removeGroundedShortTermCandidates, repairDreamingArtifacts, repairShortTermPromotionArtifacts, resolveMemoryCacheSummary, resolveMemoryFtsState, resolveMemoryVectorState };

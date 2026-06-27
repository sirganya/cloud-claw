import { s as normalizeOptionalLowercaseString } from "./string-coerce-DW4mBlAt.js";
import { t as CODEX_APP_SERVER_AUTH_MARKER } from "./model-auth-markers-Bli1-r8i.js";
//#region src/status/codex-synthetic-usage.ts
const CODEX_SYNTHETIC_USAGE_PROVIDER = "openai";
const CODEX_SYNTHETIC_USAGE_HOOK_PROVIDER = "codex";
function buildCodexSyntheticUsageAuth(params = {}) {
	return {
		provider: CODEX_SYNTHETIC_USAGE_PROVIDER,
		token: CODEX_APP_SERVER_AUTH_MARKER,
		...params.authProfileId ? { authProfileId: params.authProfileId } : {},
		hookProvider: CODEX_SYNTHETIC_USAGE_HOOK_PROVIDER
	};
}
function shouldUseCodexSyntheticUsageForRuntime(params) {
	const harness = normalizeOptionalLowercaseString(params.effectiveHarness);
	const provider = normalizeOptionalLowercaseString(params.provider);
	return harness === "codex" && (provider === "openai" || provider === "codex");
}
function hasDisplayableUsageSnapshot(snapshot) {
	return snapshot.windows.length > 0 || Boolean(snapshot.summary?.trim());
}
function usageSnapshotRank(snapshot) {
	if (hasDisplayableUsageSnapshot(snapshot)) return 2;
	return snapshot.error ? 0 : 1;
}
function mergeUsageSummaries(base, extra) {
	if (!extra || extra.providers.length === 0) return base;
	const providersById = new Map(base.providers.map((provider) => [provider.provider, provider]));
	for (const provider of extra.providers) {
		const existing = providersById.get(provider.provider);
		if (!existing || usageSnapshotRank(provider) >= usageSnapshotRank(existing)) providersById.set(provider.provider, provider);
	}
	return {
		updatedAt: base.updatedAt,
		providers: [...providersById.values()]
	};
}
//#endregion
export { mergeUsageSummaries as n, shouldUseCodexSyntheticUsageForRuntime as r, buildCodexSyntheticUsageAuth as t };

import type { ProviderAuth } from "../infra/provider-usage.auth.js";
import type { UsageSummary } from "../infra/provider-usage.types.js";
export declare const CODEX_SYNTHETIC_USAGE_PROVIDER = "openai";
export declare const CODEX_SYNTHETIC_USAGE_HOOK_PROVIDER = "codex";
export declare function buildCodexSyntheticUsageAuth(params?: {
    authProfileId?: string;
}): ProviderAuth;
export declare function shouldUseCodexSyntheticUsageForRuntime(params: {
    provider?: string;
    effectiveHarness?: string;
}): boolean;
export declare function mergeUsageSummaries(base: UsageSummary, extra: UsageSummary | undefined): UsageSummary;

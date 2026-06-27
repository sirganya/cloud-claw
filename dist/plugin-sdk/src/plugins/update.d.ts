import type { OpenClawConfig } from "../config/types.openclaw.js";
import type { PluginInstallRecord } from "../config/types.plugins.js";
import type { ClawHubTrustErrorCode } from "../infra/clawhub-install-trust.js";
import type { UpdateChannel } from "../infra/update-channels.js";
import { type ClawHubRiskAcknowledgementRequest } from "./clawhub.js";
import { type ExternalizedBundledPluginBridge } from "./externalized-bundled-plugins.js";
/** Logger surface used by plugin update flows. */
export type PluginUpdateLogger = {
    info?: (message: string) => void;
    warn?: (message: string) => void;
    error?: (message: string) => void;
    terminalLinks?: boolean;
};
/** Outcome status for one plugin update attempt. */
export type PluginUpdateStatus = "updated" | "unchanged" | "skipped" | "error";
export type PluginUpdateChannelFallback = {
    requestedSpec: string;
    usedSpec: string;
    requestedLabel: string;
    usedLabel: string;
    reason: "unavailable" | "failed";
    message: string;
};
type BasePluginUpdateOutcome = {
    pluginId: string;
    message: string;
    currentVersion?: string;
    nextVersion?: string;
    channelFallback?: PluginUpdateChannelFallback;
    warning?: string;
};
export type PluginUpdateOutcome = (BasePluginUpdateOutcome & {
    status: "skipped";
    code?: ClawHubTrustErrorCode;
}) | (BasePluginUpdateOutcome & {
    status: Exclude<PluginUpdateStatus, "skipped">;
    code?: string;
});
export type PluginUpdateSummary = {
    config: OpenClawConfig;
    changed: boolean;
    outcomes: PluginUpdateOutcome[];
};
export type PluginUpdateIntegrityDriftParams = {
    pluginId: string;
    spec: string;
    expectedIntegrity: string;
    actualIntegrity: string;
    resolvedSpec?: string;
    resolvedVersion?: string;
    dryRun: boolean;
};
export type PluginChannelSyncSummary = {
    switchedToBundled: string[];
    switchedToClawHub: string[];
    switchedToNpm: string[];
    warnings: string[];
    errors: string[];
};
export type PluginChannelSyncResult = {
    config: OpenClawConfig;
    changed: boolean;
    summary: PluginChannelSyncSummary;
};
/** Return whether a tracked plugin install source can be updated in place. */
export declare function isPluginInstallRecordUpdateSource(record: PluginInstallRecord | undefined): boolean;
/** Return whether update identity compatibility can migrate an unscoped install key. */
export declare function pluginInstallRecordMayMigrateConfigId(params: {
    pluginId: string;
    record: PluginInstallRecord | undefined;
    specOverride?: string;
}): boolean;
export declare function isClawHubTrustSkippedOutcome(outcome: {
    status: string;
    code?: string;
}): boolean;
export declare function updateNpmInstalledPlugins(params: {
    config: OpenClawConfig;
    logger?: PluginUpdateLogger;
    pluginIds?: string[];
    skipIds?: Set<string>;
    skipDisabledPlugins?: boolean;
    syncOfficialPluginInstalls?: boolean;
    disableOnFailure?: boolean;
    timeoutMs?: number;
    dryRun?: boolean;
    updateChannel?: UpdateChannel;
    officialPluginUpdateChannel?: UpdateChannel;
    dangerouslyForceUnsafeInstall?: boolean;
    specOverrides?: Record<string, string>;
    onIntegrityDrift?: (params: PluginUpdateIntegrityDriftParams) => boolean | Promise<boolean>;
    acknowledgeClawHubRisk?: boolean;
    onClawHubRisk?: (request: ClawHubRiskAcknowledgementRequest) => boolean | Promise<boolean>;
}): Promise<PluginUpdateSummary>;
export declare function syncPluginsForUpdateChannel(params: {
    config: OpenClawConfig;
    channel: UpdateChannel;
    workspaceDir?: string;
    env?: NodeJS.ProcessEnv;
    logger?: PluginUpdateLogger;
    externalizedBundledPluginBridges?: readonly ExternalizedBundledPluginBridge[];
    acknowledgeClawHubRisk?: boolean;
    onClawHubRisk?: (request: ClawHubRiskAcknowledgementRequest) => boolean | Promise<boolean>;
}): Promise<PluginChannelSyncResult>;
export {};

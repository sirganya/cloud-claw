import { type ClawHubPackageSecurityTrust } from "./clawhub.js";
export declare const CLAWHUB_TRUST_ERROR_CODE: {
    readonly CLAWHUB_SECURITY_UNAVAILABLE: "clawhub_security_unavailable";
    readonly CLAWHUB_RISK_ACKNOWLEDGEMENT_REQUIRED: "clawhub_risk_acknowledgement_required";
    readonly CLAWHUB_DOWNLOAD_BLOCKED: "clawhub_download_blocked";
};
export type ClawHubTrustErrorCode = (typeof CLAWHUB_TRUST_ERROR_CODE)[keyof typeof CLAWHUB_TRUST_ERROR_CODE];
export type ClawHubRiskAcknowledgementRequest = {
    packageName: string;
    version: string;
    trust: ClawHubPackageSecurityTrust;
    acknowledgementKind: "confirm" | "type-package";
    warning: string;
};
export type ClawHubTrustInstallRecordFields = {
    clawhubTrustDisposition: "clean" | "review-recommended" | "review-required" | "blocked";
    clawhubTrustScanStatus?: string;
    clawhubTrustModerationState?: string;
    clawhubTrustReasons?: string[];
    clawhubTrustPending?: true;
    clawhubTrustStale?: true;
    clawhubTrustCheckedAt: string;
    clawhubTrustAcknowledgedAt?: string;
};
export type ClawHubTrustAcceptedResult = {
    ok: true;
    trustInstallRecordFields: ClawHubTrustInstallRecordFields;
    warning?: string;
};
export type ClawHubTrustFailure = {
    ok: false;
    error: string;
    code?: ClawHubTrustErrorCode;
    warning?: string;
    version?: string;
};
type ClawHubInstallLogger = {
    warn?: (message: string) => void;
    terminalLinks?: boolean;
};
type ClawHubTrustSubject = {
    kind: "plugin" | "skill";
    packageName: string;
    ownerHandle?: string;
};
export declare function ensureClawHubPackageTrustAcknowledged(params: {
    subject: ClawHubTrustSubject;
    version: string;
    baseUrl?: string;
    token?: string;
    timeoutMs?: number;
    acknowledgeClawHubRisk?: boolean;
    onClawHubRisk?: (request: ClawHubRiskAcknowledgementRequest) => boolean | Promise<boolean>;
    logger?: ClawHubInstallLogger;
    mode?: "install" | "update";
}): Promise<ClawHubTrustFailure | ClawHubTrustAcceptedResult>;
export {};

/** Structured ClawHub trust details carried in gateway error payloads. */
export declare const ClawHubTrustErrorCodes: {
    readonly SECURITY_UNAVAILABLE: "clawhub_security_unavailable";
    readonly RISK_ACKNOWLEDGEMENT_REQUIRED: "clawhub_risk_acknowledgement_required";
    readonly DOWNLOAD_BLOCKED: "clawhub_download_blocked";
};
export type ClawHubTrustErrorCode = (typeof ClawHubTrustErrorCodes)[keyof typeof ClawHubTrustErrorCodes];
export type ClawHubTrustErrorDetails = {
    clawhubTrustCode?: ClawHubTrustErrorCode;
    version?: string;
    warning?: string;
};
export declare function isClawHubTrustErrorCode(value: unknown): value is ClawHubTrustErrorCode;
export declare function buildClawHubTrustErrorDetails(params: {
    code?: ClawHubTrustErrorCode;
    version?: string;
    warning?: string;
}): ClawHubTrustErrorDetails | undefined;
export declare function readClawHubTrustErrorDetails(details: unknown): ClawHubTrustErrorDetails | undefined;

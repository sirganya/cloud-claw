import type { ClawHubRiskAcknowledgementRequest } from "../infra/clawhub-install-trust.js";
export type ClawHubRiskAcknowledgementCliOptions = {
    acknowledgeClawHubRisk?: boolean;
};
export declare function resolveClawHubRiskAcknowledgementCliOptions(params: {
    acknowledgeClawHubRisk?: boolean;
    action: "installing" | "updating";
    allowPrompt?: boolean;
}): ClawHubRiskAcknowledgementCliOptions & {
    onClawHubRisk?: (request: ClawHubRiskAcknowledgementRequest) => Promise<boolean>;
};

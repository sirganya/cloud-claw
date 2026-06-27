import { i as OpenClawConfig } from "../../types.openclaw-DYWtNRsb.js";
import { _ as ProviderRequestCapability } from "../../provider-request-config-D3GamJ_F.js";
import { s as AuthProfileStore } from "../../types-BA_d98de.js";
import { h as resolveProviderHttpRequestConfig } from "../../provider-http-CX2GMvbw.js";
//#region extensions/fal/http-config.d.ts
type FalAuthenticatedRequest = {
  cfg?: OpenClawConfig;
  agentDir?: string;
  authStore?: AuthProfileStore;
};
declare function resolveFalHttpRequestConfig(params: {
  req: FalAuthenticatedRequest;
  baseUrl?: string;
  capability: ProviderRequestCapability;
}): Promise<ReturnType<typeof resolveProviderHttpRequestConfig>>;
//#endregion
export { resolveFalHttpRequestConfig };
import { M as OpenClawPluginGatewayRuntimeScopeSurface } from "./types-6kOfVdoQ.js";
import { t as PluginHttpRouteRegistration$1 } from "./registry-types-BmBkdJix.js";
//#region src/plugins/registry.d.ts
type PluginHttpRouteRegistration = PluginHttpRouteRegistration$1 & {
  gatewayRuntimeScopeSurface?: OpenClawPluginGatewayRuntimeScopeSurface;
};
//#endregion
export { PluginHttpRouteRegistration as t };
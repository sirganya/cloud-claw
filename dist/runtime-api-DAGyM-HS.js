import "./media-runtime-Bl6jdONS.js";
import "./text-chunking-TOrSHG9r.js";
import { t as createPluginRuntimeStore } from "./runtime-store-uAKGMqTs.js";
import "./channel-outbound-Dyq1Uye3.js";
import "./outbound-media-B5hoKZuF.js";
import "./ssrf-runtime-DlPnh6ZA.js";
import "./dangerous-name-runtime-cJriWyuh.js";
import "./channel-status-DaJjFFaU.js";
import "./bundled-channel-config-schema-BPBaLKNk.js";
import "./channel-config-primitives-CpeVY1dZ.js";
import "./channel-actions-DShhnYe7.js";
import "./channel-inbound-Cnrr8DuQ.js";
import "./channel-feedback-BHEBo2DZ.js";
import "./channel-pairing-BccU02DI.js";
import "./webhook-request-guards-DsPJqnE8.js";
import "./webhook-ingress-tn5iw8WO.js";
import "./webhook-targets-BdlVWlAd.js";
//#region extensions/googlechat/src/runtime.ts
const { setRuntime: setGoogleChatRuntime, getRuntime: getGoogleChatRuntime } = createPluginRuntimeStore({
	pluginId: "googlechat",
	errorMessage: "Google Chat runtime not initialized"
});
//#endregion
export { setGoogleChatRuntime as n, getGoogleChatRuntime as t };

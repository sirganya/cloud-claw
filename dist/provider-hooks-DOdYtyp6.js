import { a as createGoogleThinkingStreamWrapper } from "./provider-stream-shared-BEnmJSVP.js";
import { a as buildProviderReplayFamilyHooks } from "./provider-model-shared-CHU2oaiO.js";
import { n as buildProviderToolCompatFamilyHooks } from "./provider-tools-VmwDm8UA.js";
import "./thinking-api-BWKbdLAn.js";
import { u as resolveGoogleThinkingProfile } from "./provider-policy-DJ6mQDK_.js";
//#region extensions/google/provider-hooks.ts
const GOOGLE_GEMINI_PROVIDER_HOOKS = {
	...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
	...buildProviderToolCompatFamilyHooks("gemini"),
	resolveThinkingProfile: (context) => resolveGoogleThinkingProfile(context),
	wrapStreamFn: createGoogleThinkingStreamWrapper
};
//#endregion
export { GOOGLE_GEMINI_PROVIDER_HOOKS as t };

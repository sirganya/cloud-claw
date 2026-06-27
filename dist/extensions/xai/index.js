import { l as jsonResult } from "../../common-BWZd4XIM.js";
import { u as defaultToolStreamExtraParams } from "../../provider-stream-shared-BEnmJSVP.js";
import { r as OPENAI_COMPATIBLE_REPLAY_HOOKS } from "../../provider-model-shared-CHU2oaiO.js";
import { t as defineSingleProviderPluginEntry } from "../../provider-entry-B7mS39n-.js";
import "../../provider-web-search-OsCqgHUy.js";
import { t as normalizeXaiModelId } from "../../model-id-BRM_wbb3.js";
import { n as buildLiveXaiProvider, r as buildXaiProvider, t as buildLiveXaiOAuthProvider } from "../../provider-catalog-DOUepVH2.js";
import { n as applyXaiConfig, t as XAI_DEFAULT_MODEL_REF } from "../../onboard-ChRgNw9T.js";
import { t as buildXaiImageGenerationProvider } from "../../image-generation-provider-BKGAGylj.js";
import { t as applyXaiRuntimeModelCompat } from "../../runtime-model-compat-DKFAGNg9.js";
import { n as resolveXaiForwardCompatModel, t as isModernXaiModel } from "../../provider-models-ClTch_v1.js";
import { r as resolveXaiTransport } from "../../api-BuvKwW3h.js";
import { n as createCodeExecutionToolDefinition, t as buildMissingCodeExecutionApiKeyPayload } from "../../code-execution-tool-shared-CeAkKo1Y.js";
import { t as resolveThinkingProfile } from "../../provider-policy-api-DAVDkXJX.js";
import { t as buildXaiRealtimeTranscriptionProvider } from "../../realtime-transcription-provider-Bgiz3bH1.js";
import { t as buildXaiSpeechProvider } from "../../speech-provider-C2aE7FDe.js";
import { n as resolveFallbackXaiAuth, t as isXaiToolEnabled } from "../../tool-auth-shared-BPzAWDYB.js";
import { n as readPluginCodeExecutionConfig, r as resolveCodeExecutionEnabled } from "../../code-execution-config-DK75JqUQ.js";
import { t as resolveEffectiveXSearchConfig } from "../../x-search-config-Lb2qSz6n.js";
import { r as wrapXaiProviderStream } from "../../stream-DIWlzF7T.js";
import { n as buildXaiMediaUnderstandingProvider } from "../../stt-8KpB3srR.js";
import { t as buildXaiVideoGenerationProvider } from "../../video-generation-provider-bayVE3ic.js";
import { t as createXaiWebSearchProvider } from "../../web-search-BRAJGkly.js";
import { n as createXSearchToolDefinition, t as buildMissingXSearchApiKeyPayload } from "../../x-search-tool-shared-CF3dGCVO.js";
import { S as refreshXaiOAuthCredential, _ as createXaiOAuthAuthMethod, g as createXaiDeviceCodeAuthMethod } from "../../xai-oauth-DBOP-taW.js";
//#region extensions/xai/index.ts
const PROVIDER_ID = "xai";
const XAI_CREDIT_OR_SPENDING_LIMIT_RE = /\b(?:used all available credits|monthly spending limit|purchase more credits|raise your spending limit)\b/i;
const XAI_RATE_LIMIT_RE = /\b(?:rate limit exceeded|too many requests)\b/i;
let codeExecutionModulePromise;
let xSearchModulePromise;
function loadCodeExecutionModule() {
	codeExecutionModulePromise ??= import("./code-execution.js");
	return codeExecutionModulePromise;
}
function loadXSearchModule() {
	xSearchModulePromise ??= import("./x-search.js");
	return xSearchModulePromise;
}
function classifyXaiFailoverReason(errorMessage) {
	if (XAI_CREDIT_OR_SPENDING_LIMIT_RE.test(errorMessage)) return "billing";
	if (XAI_RATE_LIMIT_RE.test(errorMessage)) return "rate_limit";
}
function hasResolvableXaiApiKey(config, auth) {
	return isXaiToolEnabled({
		sourceConfig: config,
		auth
	});
}
function isCodeExecutionEnabled(config, auth) {
	return resolveCodeExecutionEnabled({
		sourceConfig: config,
		runtimeConfig: config,
		config: readPluginCodeExecutionConfig(config),
		auth
	});
}
function isXSearchEnabled(config, auth) {
	if ((config && typeof config === "object" ? resolveEffectiveXSearchConfig(config) : void 0)?.enabled === false) return false;
	return hasResolvableXaiApiKey(config, auth);
}
function createLazyCodeExecutionTool(ctx) {
	if (!isCodeExecutionEnabled(ctx.runtimeConfig ?? ctx.config, ctx)) return null;
	return createCodeExecutionToolDefinition(async (toolCallId, args) => {
		const { createCodeExecutionTool } = await loadCodeExecutionModule();
		const tool = createCodeExecutionTool({
			config: ctx.config,
			runtimeConfig: ctx.runtimeConfig ?? null,
			auth: ctx
		});
		if (!tool) return jsonResult(buildMissingCodeExecutionApiKeyPayload());
		return await tool.execute(toolCallId, args);
	});
}
function createLazyXSearchTool(ctx) {
	if (!isXSearchEnabled(ctx.runtimeConfig ?? ctx.config, ctx)) return null;
	return createXSearchToolDefinition(async (toolCallId, args) => {
		const { createXSearchTool } = await loadXSearchModule();
		const tool = createXSearchTool({
			config: ctx.config,
			runtimeConfig: ctx.runtimeConfig ?? null,
			auth: ctx
		});
		if (!tool) return jsonResult(buildMissingXSearchApiKeyPayload());
		return await tool.execute(toolCallId, args);
	});
}
var xai_default = defineSingleProviderPluginEntry({
	id: "xai",
	name: "xAI Plugin",
	description: "Bundled xAI plugin",
	provider: {
		label: "xAI",
		aliases: ["x-ai"],
		docsPath: "/providers/xai",
		auth: [{
			methodId: "api-key",
			label: "xAI API key",
			hint: "API key",
			optionKey: "xaiApiKey",
			flagName: "--xai-api-key",
			envVar: "XAI_API_KEY",
			promptMessage: "Enter xAI API key",
			defaultModel: XAI_DEFAULT_MODEL_REF,
			applyConfig: (cfg) => applyXaiConfig(cfg),
			wizard: { groupLabel: "xAI (Grok)" }
		}],
		extraAuth: [createXaiOAuthAuthMethod(), createXaiDeviceCodeAuthMethod()],
		catalog: {
			order: "simple",
			run: async (ctx) => {
				const auth = ctx.resolveProviderAuth(PROVIDER_ID);
				try {
					const { resolveApiKeyForProvider } = await import("../../plugin-sdk/provider-auth-runtime.js");
					const runtimeAuth = await resolveApiKeyForProvider({
						provider: PROVIDER_ID,
						cfg: ctx.config,
						...ctx.agentDir ? { agentDir: ctx.agentDir } : {},
						...ctx.workspaceDir ? { workspaceDir: ctx.workspaceDir } : {},
						...auth.profileId ? {
							profileId: auth.profileId,
							lockedProfile: true
						} : {}
					});
					if (runtimeAuth?.mode === "oauth" && runtimeAuth.apiKey) return { provider: await buildLiveXaiOAuthProvider({ discoveryApiKey: runtimeAuth.apiKey }) };
				} catch {
					if (auth.mode === "oauth") {}
				}
				if (auth.apiKey) return { provider: await buildLiveXaiProvider({
					apiKey: auth.apiKey,
					discoveryApiKey: auth.discoveryApiKey
				}) };
				const apiKey = ctx.resolveProviderApiKey(PROVIDER_ID);
				if (!apiKey.apiKey) return null;
				return { provider: await buildLiveXaiProvider({
					apiKey: apiKey.apiKey,
					discoveryApiKey: apiKey.discoveryApiKey
				}) };
			},
			staticRun: async () => ({ provider: buildXaiProvider() })
		},
		...OPENAI_COMPATIBLE_REPLAY_HOOKS,
		prepareExtraParams: (ctx) => defaultToolStreamExtraParams(ctx.extraParams),
		wrapStreamFn: wrapXaiProviderStream,
		resolveSyntheticAuth: ({ config }) => {
			const fallbackAuth = resolveFallbackXaiAuth(config);
			if (!fallbackAuth) return;
			return {
				apiKey: fallbackAuth.apiKey,
				source: fallbackAuth.source,
				mode: "api-key"
			};
		},
		normalizeResolvedModel: ({ model }) => applyXaiRuntimeModelCompat(model),
		normalizeTransport: ({ provider, api, baseUrl }) => resolveXaiTransport({
			provider,
			api,
			baseUrl
		}),
		normalizeModelId: ({ modelId }) => normalizeXaiModelId(modelId),
		resolveDynamicModel: (ctx) => resolveXaiForwardCompatModel({
			providerId: PROVIDER_ID,
			ctx
		}),
		refreshOAuth: refreshXaiOAuthCredential,
		resolveThinkingProfile,
		isModernModelRef: ({ modelId }) => isModernXaiModel(modelId),
		classifyFailoverReason: ({ errorMessage }) => classifyXaiFailoverReason(errorMessage)
	},
	register(api) {
		api.registerWebSearchProvider(createXaiWebSearchProvider());
		api.registerMediaUnderstandingProvider(buildXaiMediaUnderstandingProvider());
		api.registerVideoGenerationProvider(buildXaiVideoGenerationProvider());
		api.registerImageGenerationProvider(buildXaiImageGenerationProvider());
		api.registerSpeechProvider(buildXaiSpeechProvider());
		api.registerRealtimeTranscriptionProvider(buildXaiRealtimeTranscriptionProvider());
		api.registerTool((ctx) => createLazyCodeExecutionTool(ctx), { name: "code_execution" });
		api.registerTool((ctx) => createLazyXSearchTool(ctx), { name: "x_search" });
	}
});
//#endregion
export { xai_default as default };

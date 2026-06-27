import { i as OpenClawConfig } from "./types.openclaw-DYWtNRsb.js";
import { Hl as GenerateVideoRuntimeResult, Vl as GenerateVideoParams } from "./types-6kOfVdoQ.js";
import { t as SubsystemLogger } from "./subsystem-CfQVin8T.js";
import { n as getProviderEnvVars } from "./provider-env-vars-XGJ5o-wJ.js";
import { s as VideoGenerationProvider } from "./types-ColXj3zu.js";
import { n as listVideoGenerationProviders, t as getVideoGenerationProvider } from "./provider-registry-C_CQ0N6j.js";

//#region src/video-generation/runtime.d.ts
declare const log: SubsystemLogger;
type VideoGenerationRuntimeDeps = {
  getProvider?: typeof getVideoGenerationProvider;
  listProviders?: typeof listVideoGenerationProviders;
  getProviderEnvVars?: typeof getProviderEnvVars;
  log?: Pick<typeof log, "debug" | "warn">;
};
declare function listRuntimeVideoGenerationProviders(params?: {
  config?: OpenClawConfig;
}, deps?: VideoGenerationRuntimeDeps): VideoGenerationProvider[];
declare function generateVideo(params: GenerateVideoParams, deps?: VideoGenerationRuntimeDeps): Promise<GenerateVideoRuntimeResult>;
//#endregion
export { listRuntimeVideoGenerationProviders as n, generateVideo as t };
import "./paths-DyelItkH.js";
import "./fs-safe-aqmM_n6V.js";
import "./utils-D2Wwrmfu.js";
import "./types.secrets-B_tDs-aP.js";
import "./subsystem-yNfG7O3v.js";
import "./agent-scope-ZuqArM9O.js";
import "./config-xg-N7tXV.js";
import "./mime-BZF3xopk.js";
import "./paths-fL1rzuvE.js";
import { n as onInternalSessionTranscriptUpdate } from "./transcript-events-Cdengdon.js";
import "./memory-search-DYCEqw5s.js";
import "./fs-utils-H8x4ZtGU.js";
import "./openclaw-runtime-config-DiD-dgRq.js";
import "./openclaw-runtime-session-DiD-dgRq.js";
//#region src/plugin-sdk/memory-core-host-engine-foundation.ts
/**
* Public SDK foundation surface for memory host engine config, paths, and shared helpers.
*/
const MEMORY_CORE_TRANSCRIPT_UPDATE_SUBSCRIBER_KEY = Symbol.for("openclaw.memoryCore.sessionTranscriptUpdateSubscriber");
globalThis[MEMORY_CORE_TRANSCRIPT_UPDATE_SUBSCRIBER_KEY] ??= onInternalSessionTranscriptUpdate;
//#endregion
export {};

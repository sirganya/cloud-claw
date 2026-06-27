import { i as OpenClawConfig } from "./types.openclaw-DM9kKIPe.js";
import { r as ChannelConfigUiHint } from "./types.config-D1pSqbn8.js";
import { t as ChannelPlugin } from "./types.plugin-BSBBTlSg.js";
import { $n as PluginRuntime } from "./types-DK2b65UA.js";
import { r as buildChannelConfigSchema } from "./config-schema-CIXTfG6L.js";
import { r as parseOptionalDelimitedEntries } from "./helpers-B-TnKBy9.js";
import { L as PluginCommandContext, g as OpenClawPluginApi } from "./plugin-entry-C0MhJJJY.js";
import { t as clearAccountEntryFields } from "./config-helpers-BhqUvcba.js";
import { c as tryReadSecretFileSync } from "./secret-file-CjbjgOXf.js";
import { a as buildThreadAwareOutboundSessionRoute, c as defineChannelPluginEntry, f as recoverCurrentThreadSessionId, i as buildChannelOutboundSessionRoute, l as defineSetupPluginEntry, m as stripTargetKindPrefix, o as createChannelPluginBase$1, p as stripChannelTargetPrefix, s as createChatChannelPlugin, t as ChannelOutboundSessionRouteParams } from "./core-Dzcbx7G_.js";

//#region src/plugin-sdk/channel-core.d.ts
/** Creates a channel plugin base while keeping the public import on this SDK subpath. */
declare const createChannelPluginBase: typeof createChannelPluginBase$1;
//#endregion
export { type ChannelConfigUiHint, type ChannelOutboundSessionRouteParams, type ChannelPlugin, type OpenClawConfig, type OpenClawPluginApi, type PluginCommandContext, type PluginRuntime, buildChannelConfigSchema, buildChannelOutboundSessionRoute, buildThreadAwareOutboundSessionRoute, clearAccountEntryFields, createChannelPluginBase, createChatChannelPlugin, defineChannelPluginEntry, defineSetupPluginEntry, parseOptionalDelimitedEntries, recoverCurrentThreadSessionId, stripChannelTargetPrefix, stripTargetKindPrefix, tryReadSecretFileSync };
import { i as OpenClawConfig } from "../../types.openclaw-DYWtNRsb.js";
import { T as ChannelMeta, c as ChannelCapabilities, g as ChannelLogSink, r as ChannelAccountSnapshot, v as ChannelMessageActionAdapter, y as ChannelMessageActionContext } from "../../types.core-BKrwnajs.js";
import { n as RuntimeEnv } from "../../runtime-Bxifh4bY.js";
import { i as WizardPrompter } from "../../prompts-DgKIGa-v.js";
import { L as ChannelResolveKind, R as ChannelResolveResult, U as ChannelStatusAdapter, k as ChannelGatewayContext } from "../../types.adapters-DKKcRwLj.js";
import { b as OutboundDeliveryResult, i as ChannelOutboundContext, n as ChannelOutboundAdapter } from "../../outbound.types-m5NCSwij.js";
import { t as ChannelPlugin } from "../../types.plugin-AW8hosZI.js";
import { $n as PluginRuntime } from "../../types-6kOfVdoQ.js";
import { t as twitchPlugin } from "../../plugin-DrLXc2WP.js";

//#region extensions/twitch/src/runtime.d.ts
declare const setTwitchRuntime: (next: PluginRuntime) => void, getTwitchRuntime: () => PluginRuntime;
//#endregion
export { type ChannelAccountSnapshot, type ChannelCapabilities, type ChannelGatewayContext, type ChannelLogSink, type ChannelMessageActionAdapter, type ChannelMessageActionContext, type ChannelMeta, type ChannelOutboundAdapter, type ChannelOutboundContext, type ChannelPlugin, type ChannelResolveKind, type ChannelResolveResult, type ChannelStatusAdapter, type OpenClawConfig, type OutboundDeliveryResult, type RuntimeEnv, type WizardPrompter, setTwitchRuntime, twitchPlugin };
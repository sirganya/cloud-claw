import { n as defineBundledChannelSetupEntry } from "../../channel-entry-contract-bMicRy3E.js";
//#region extensions/twitch/setup-entry.ts
var setup_entry_default = defineBundledChannelSetupEntry({
	importMetaUrl: import.meta.url,
	plugin: {
		specifier: "./setup-plugin-api.js",
		exportName: "twitchSetupPlugin"
	}
});
//#endregion
export { setup_entry_default as default };

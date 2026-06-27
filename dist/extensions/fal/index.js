import { t as definePluginEntry } from "../../plugin-entry-BZpzqykQ.js";
import { t as buildFalImageGenerationProvider } from "../../image-generation-provider-C1LdRici.js";
import { t as buildFalMusicGenerationProvider } from "../../music-generation-provider-BsOUSKOo.js";
import { t as createFalProvider } from "../../provider-registration-DK1Tg8u_.js";
import { t as buildFalVideoGenerationProvider } from "../../video-generation-provider-Cz4hVlbu.js";
var fal_default = definePluginEntry({
	id: "fal",
	name: "fal Provider",
	description: "Bundled fal image, video, and music generation provider",
	register(api) {
		api.registerProvider(createFalProvider());
		api.registerImageGenerationProvider(buildFalImageGenerationProvider());
		api.registerMusicGenerationProvider(buildFalMusicGenerationProvider());
		api.registerVideoGenerationProvider(buildFalVideoGenerationProvider());
	}
});
//#endregion
export { fal_default as default };

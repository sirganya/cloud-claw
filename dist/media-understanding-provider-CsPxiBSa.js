import { c as isRecord } from "./utils-D2Wwrmfu.js";
import { i as describeImagesWithModelPayloadTransform, n as describeImageWithModelPayloadTransform } from "./image-runtime-BpOxB3tG.js";
import "./media-understanding-CvWFFzXt.js";
import "./string-coerce-runtime-DmsMmHES.js";
//#region extensions/opencode/media-understanding-provider.ts
function stripOpencodeDisabledResponsesReasoningPayload(payload) {
	if (!isRecord(payload)) return;
	const reasoning = payload.reasoning;
	if (reasoning === "none") {
		delete payload.reasoning;
		return;
	}
	if (!isRecord(reasoning) || reasoning.effort !== "none") return;
	delete payload.reasoning;
}
const stripDisabledResponsesReasoning = (payload) => {
	stripOpencodeDisabledResponsesReasoningPayload(payload);
};
const opencodeMediaUnderstandingProvider = {
	id: "opencode",
	capabilities: ["image"],
	defaultModels: { image: "gpt-5-nano" },
	describeImage: (request) => describeImageWithModelPayloadTransform(request, stripDisabledResponsesReasoning),
	describeImages: (request) => describeImagesWithModelPayloadTransform(request, stripDisabledResponsesReasoning)
};
//#endregion
export { stripOpencodeDisabledResponsesReasoningPayload as n, opencodeMediaUnderstandingProvider as t };

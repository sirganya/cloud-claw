import { f as MediaUnderstandingProvider, n as AudioTranscriptionResult, t as AudioTranscriptionRequest } from "../../types-tbsURQ_Q.js";
//#region extensions/elevenlabs/media-understanding-provider.d.ts
declare function transcribeElevenLabsAudio(req: AudioTranscriptionRequest): Promise<AudioTranscriptionResult>;
declare const elevenLabsMediaUnderstandingProvider: MediaUnderstandingProvider;
//#endregion
export { elevenLabsMediaUnderstandingProvider, transcribeElevenLabsAudio };
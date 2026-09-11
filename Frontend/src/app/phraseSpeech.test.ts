import { beforeEach, describe, expect, it, vi } from "vitest";

const speak = vi.fn().mockResolvedValue(undefined);

vi.mock("@capacitor-community/text-to-speech", () => ({
  TextToSpeech: { speak },
}));

const { canSpeakPhrase, speakPhrase } = await import("./phraseSpeech");

describe("phraseSpeech", () => {
  beforeEach(() => {
    speak.mockClear();
    const speechSynthesis = { cancel: vi.fn(), speak: vi.fn() };
    class SpeechSynthesisUtterance {
      lang = "";
      constructor(public text: string) {}
    }
    vi.stubGlobal("window", { speechSynthesis, SpeechSynthesisUtterance });
    vi.stubGlobal("speechSynthesis", speechSynthesis);
    vi.stubGlobal("SpeechSynthesisUtterance", SpeechSynthesisUtterance);
  });

  it("offers Hear phrase on web when Speech Synthesis exists", () => {
    expect(canSpeakPhrase()).toBe(true);
  });

  it("speaks with the Web Speech API on web", async () => {
    await speakPhrase("on the other hand");
    expect(speak).not.toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalledOnce();
  });
});

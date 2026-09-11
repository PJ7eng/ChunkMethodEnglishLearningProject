import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { isNativePlatform } from "./platform";

function canUseWebSpeech(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.speechSynthesis !== "undefined" &&
      typeof window.SpeechSynthesisUtterance !== "undefined"
    );
  } catch {
    return false;
  }
}

export function canSpeakPhrase(): boolean {
  return isNativePlatform || canUseWebSpeech();
}

/**
 * Native uses the Capacitor TTS plugin (static import). Do not await the
 * plugin object itself — Capacitor proxies treat `.then` as a native method.
 */
export async function speakPhrase(phrase: string): Promise<void> {
  const text = phrase.trim();
  if (!text) return;

  if (isNativePlatform) {
    await TextToSpeech.speak({
      text,
      lang: "en-US",
      rate: 0.95,
    });
    return;
  }

  if (!canUseWebSpeech()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

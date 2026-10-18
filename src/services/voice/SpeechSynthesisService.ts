// Reusable Browser SpeechSynthesis Service for AgroSmart AI
// Supports English ('en-IN', 'en-US') and Telugu ('te-IN')

export interface SpeechSynthesisCallbacks {
  onStart: () => void;
  onEnd: () => void;
  onError: (error: string) => void;
}

export class SpeechSynthesisService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isMuted: boolean = false;
  private lastSpokenText: string = "";
  private lastSpokenLang: "en" | "te" = "en";
  private callbacks: Partial<SpeechSynthesisCallbacks> = {};

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public setCallbacks(callbacks: Partial<SpeechSynthesisCallbacks>) {
    this.callbacks = callbacks;
  }

  public isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  private getBestVoice(lang: "en" | "te"): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    if (lang === "te") {
      // Find Telugu voice
      const teluguVoice = this.voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith("te") ||
          v.name.toLowerCase().includes("telugu")
      );
      if (teluguVoice) return teluguVoice;

      // Fallback: Indian English or general voice if Telugu voice pack isn't installed
      const indianVoice = this.voices.find((v) =>
        v.lang.toLowerCase().includes("en-in")
      );
      if (indianVoice) return indianVoice;
    } else {
      // English: Prefer Indian English (en-IN)
      const indianVoice = this.voices.find((v) =>
        v.lang.toLowerCase().includes("en-in")
      );
      if (indianVoice) return indianVoice;

      const englishVoice = this.voices.find((v) =>
        v.lang.toLowerCase().startsWith("en")
      );
      if (englishVoice) return englishVoice;
    }

    return this.voices[0] || null;
  }

  public speak(
    text: string,
    lang: "en" | "te" = "en",
    onFinish?: () => void
  ): boolean {
    if (!this.synth || this.isMuted || !text.trim()) {
      onFinish?.();
      return false;
    }

    // Cancel any ongoing speech to avoid overlapping
    this.stop();

    this.lastSpokenText = text;
    this.lastSpokenLang = lang;

    try {
      const cleanText = text
        .replace(/[*_#`~]/g, "") // strip markdown asterisks and formatting
        .replace(/₹/g, " Rupees ")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = this.getBestVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = lang === "te" ? "te-IN" : "en-IN";
      utterance.rate = lang === "te" ? 0.95 : 1.0; // slightly natural pacing
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.callbacks.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.callbacks.onEnd?.();
        onFinish?.();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("SpeechSynthesis error:", e.error);
          this.callbacks.onError?.(e.error);
        }
        this.callbacks.onEnd?.();
        onFinish?.();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
      return true;
    } catch (e) {
      console.error("SpeechSynthesis speak exception:", e);
      onFinish?.();
      return false;
    }
  }

  public stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // Ignored
      }
    }
    this.currentUtterance = null;
    this.callbacks.onEnd?.();
  }

  public repeatLast(): boolean {
    if (!this.lastSpokenText) return false;
    return this.speak(this.lastSpokenText, this.lastSpokenLang);
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }
}

export const speechSynthesisService = new SpeechSynthesisService();

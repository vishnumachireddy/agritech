// Reusable Web Speech API Recognition Service for AgroSmart AI
// Supports English ('en-IN', 'en-US') and Telugu ('te-IN')

export type RecognitionState = "idle" | "listening" | "processing" | "error";

export interface SpeechRecognitionCallbacks {
  onStateChange: (state: RecognitionState) => void;
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (errorMessage: string, errorCode: string) => void;
  onEnd: () => void;
}

// Window typing for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentLanguage: "en" | "te" = "en";
  private callbacks: Partial<SpeechRecognitionCallbacks> = {};
  private silenceTimer: any = null;
  private manualStop: boolean = false;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn("SpeechRecognition API is not supported in this browser.");
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false; // turn-by-turn conversational commands
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.updateLocale();

      this.recognition.onstart = () => {
        this.isListening = true;
        this.manualStop = false;
        this.callbacks.onStateChange?.("listening");
        this.resetSilenceTimer();
      };

      this.recognition.onresult = (event: any) => {
        this.resetSilenceTimer();
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const text = final || interim;
        const isFinal = Boolean(final);

        if (text) {
          this.callbacks.onTranscript?.(text.trim(), isFinal);
        }

        if (isFinal) {
          this.callbacks.onStateChange?.("processing");
        }
      };

      this.recognition.onerror = (event: any) => {
        clearTimeout(this.silenceTimer);
        this.isListening = false;
        const errCode = event.error || "unknown";
        let message = "Speech recognition encountered an issue.";

        switch (errCode) {
          case "not-allowed":
          case "permission-denied":
            message =
              this.currentLanguage === "te"
                ? "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బ్రౌజర్ సెట్టింగ్స్‌లో మైక్రోఫోన్ అనుమతించండి."
                : "Microphone access was denied. Please allow microphone permissions in your browser.";
            break;
          case "no-speech":
            message =
              this.currentLanguage === "te"
                ? "శబ్దం వినిపించలేదు. దయచేసి మళ్లీ ప్రయత్నించండి."
                : "No speech was detected. Please try speaking again.";
            break;
          case "network":
            message =
              this.currentLanguage === "te"
                ? "నెట్‌వర్క్ సమస్య ఏర్పడింది. దయచేసి ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేయండి."
                : "Network error occurred with speech recognition. Check your connection.";
            break;
          case "aborted":
            // Normal cancel, ignore
            return;
          default:
            message =
              this.currentLanguage === "te"
                ? "వాయిస్ గుర్తుపట్టడంలో సమస్య ఏర్పడింది."
                : `Speech recognition error: ${errCode}`;
        }

        this.callbacks.onStateChange?.("error");
        this.callbacks.onError?.(message, errCode);
      };

      this.recognition.onend = () => {
        clearTimeout(this.silenceTimer);
        this.isListening = false;
        if (!this.manualStop) {
          this.callbacks.onStateChange?.("idle");
        }
        this.callbacks.onEnd?.();
      };
    } catch (e) {
      console.error("Failed to initialize SpeechRecognition:", e);
      this.recognition = null;
    }
  }

  private resetSilenceTimer() {
    clearTimeout(this.silenceTimer);
    // 8 second silence timeout
    this.silenceTimer = setTimeout(() => {
      if (this.isListening) {
        this.stop();
      }
    }, 8000);
  }

  public updateLocale() {
    if (!this.recognition) return;
    // Chromium Web Speech API uses BCP-47 language tags
    this.recognition.lang = this.currentLanguage === "te" ? "te-IN" : "en-IN";
  }

  public setLanguage(lang: "en" | "te") {
    this.currentLanguage = lang;
    this.updateLocale();
  }

  public setCallbacks(callbacks: Partial<SpeechRecognitionCallbacks>) {
    this.callbacks = callbacks;
  }

  public isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  public start(lang?: "en" | "te"): boolean {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) {
        this.callbacks.onError?.(
          this.currentLanguage === "te"
            ? "ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి టెక్స్ట్ ఉపయోగించండి."
            : "Voice recognition is not supported in this browser. Please use text input.",
          "unsupported"
        );
        return false;
      }
    }

    if (lang) {
      this.setLanguage(lang);
    }

    if (this.isListening) {
      return true;
    }

    try {
      this.manualStop = false;
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn("SpeechRecognition start error:", err);
      return false;
    }
  }

  public stop() {
    clearTimeout(this.silenceTimer);
    this.manualStop = true;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignored
      }
    }
    this.isListening = false;
    this.callbacks.onStateChange?.("idle");
  }

  public abort() {
    clearTimeout(this.silenceTimer);
    this.manualStop = true;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // Ignored
      }
    }
    this.isListening = false;
    this.callbacks.onStateChange?.("idle");
  }
}

export const speechRecognitionService = new SpeechRecognitionService();

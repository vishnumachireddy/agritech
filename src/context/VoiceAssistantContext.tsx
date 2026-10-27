// Voice Assistant React Context for AgroSmart AI
// Centralizes speech recognition, speech synthesis, intent resolution, and execution state across all pages.

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { speechRecognitionService, RecognitionState } from "@/services/voice/SpeechRecognitionService";
import { speechSynthesisService } from "@/services/voice/SpeechSynthesisService";
import { intentResolver, ResolvedIntent } from "@/services/voice/IntentResolver";
import { actionRegistry, PendingAction } from "@/services/voice/ActionRegistry";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface MessageHistoryItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  type?: string;
  targetPath?: string;
  cardType?: "orders_list" | "order_summary" | "bulk_progress" | "weather" | "price_list" | "schemes";
  cardData?: any;
}

export interface VoiceAssistantContextType {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isOpen: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  lastResponse: string;
  pendingAction: PendingAction | null;
  history: MessageHistoryItem[];
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  sendText: (text: string) => Promise<void>;
  confirmPendingAction: () => Promise<void>;
  cancelPendingAction: () => void;
  toggleMute: () => void;
  stopSpeaking: () => void;
  repeatLastResponse: () => void;
  setIsOpen: (open: boolean) => void;
  clearHistory: () => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(undefined);

export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error("useVoiceAssistant must be used within a VoiceAssistantProvider");
  }
  return context;
};

export const VoiceAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, isTelugu } = useLanguage();
  const { user, role } = useAuth();

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<MessageHistoryItem[]>(() => {
    return [
      {
        id: "msg_init",
        role: "assistant",
        text: isTelugu
          ? "నమస్కారం! నేను మీ అగ్రోస్మార్ట్ వాయిస్ సహాయకుడిని. 'పంట స్కానర్ తెరువు', 'నేటి ధరలు' లేదా 'డ్రోన్ బుక్ చేయి' అని మాట్లాడండి."
          : "Hello! I am your AgroSmart Voice Assistant. You can speak commands like 'Open Crop Scanner', 'Check Today's Prices', or 'Book a Drone'.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const pendingActionRef = useRef<PendingAction | null>(pendingAction);
  useEffect(() => {
    pendingActionRef.current = pendingAction;
  }, [pendingAction]);

  // Sync supported state
  useEffect(() => {
    setIsSupported(speechRecognitionService.isSupported());
  }, []);

  // Sync language with speech services
  useEffect(() => {
    speechRecognitionService.setLanguage(language);
  }, [language]);

  // Setup callbacks on mount
  useEffect(() => {
    speechSynthesisService.setCallbacks({
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });

    speechRecognitionService.setCallbacks({
      onStateChange: (state: RecognitionState) => {
        setIsListening(state === "listening");
        setIsProcessing(state === "processing");
        if (state === "error") {
          setIsListening(false);
          setIsProcessing(false);
        }
      },
      onTranscript: (liveTranscript: string, isFinal: boolean) => {
        if (isFinal) {
          setTranscript(liveTranscript);
          setInterimTranscript("");
          processUserInput(liveTranscript);
        } else {
          setInterimTranscript(liveTranscript);
        }
      },
      onError: (errMsg: string) => {
        setError(errMsg);
        toast.error(errMsg);
        setIsListening(false);
        setIsProcessing(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    return () => {
      speechSynthesisService.stop();
      speechRecognitionService.abort();
    };
  }, [location.pathname, language, user, role]);

  /**
   * Central processor for spoken or written user instructions
   */
  const processUserInput = useCallback(
    async (userInput: string) => {
      if (!userInput.trim()) return;

      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const userItem: MessageHistoryItem = {
        id: "usr_" + Date.now(),
        role: "user",
        text: userInput,
        time: timeStr,
      };

      setHistory((prev) => [...prev, userItem]);
      setIsOpen(true);
      setError(null);
      setIsProcessing(true);

      try {
        const resolved: ResolvedIntent = await intentResolver.resolve(userInput, {
          currentPath: location.pathname,
          language,
          userRole: role || undefined,
          userId: user?.id,
          userName: user?.full_name || user?.user_metadata?.full_name,
          pendingAction: pendingActionRef.current,
        });

        // Determine spoken string based on selected language
        const spokenText = language === "te" ? resolved.spokenResponseTe : resolved.spokenResponseEn;
        setLastResponse(spokenText);

        const assistantItem: MessageHistoryItem = {
          id: "ast_" + Date.now(),
          role: "assistant",
          text: spokenText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: resolved.type,
          targetPath: resolved.targetPath,
          cardType: resolved.cardType,
          cardData: resolved.cardData,
        };

        // Handle specific actions
        if (resolved.type === "control_stop") {
          speechSynthesisService.stop();
          setIsSpeaking(false);
        } else if (resolved.type === "control_repeat") {
          speechSynthesisService.repeatLast();
        } else if (resolved.type === "control_language" && resolved.executedData?.targetLanguage) {
          setLanguage(resolved.executedData.targetLanguage);
          speechSynthesisService.speak(spokenText, resolved.executedData.targetLanguage);
        } else if (resolved.type === "initiate_booking" && resolved.pendingAction) {
          setPendingAction(resolved.pendingAction);
          speechSynthesisService.speak(spokenText, language);
          if (resolved.targetPath && location.pathname !== resolved.targetPath) {
            navigate(resolved.targetPath);
          }
        } else if (resolved.type === "initiate_status_update" && resolved.pendingAction) {
          setPendingAction(resolved.pendingAction);
          speechSynthesisService.speak(spokenText, language);
        } else if (resolved.type === "confirm_action" && pendingActionRef.current) {
          // Execute confirmed consequential action
          const action = pendingActionRef.current;
          setPendingAction(null);
          let result;
          if (action.actionType === "update_order_status") {
            result = await actionRegistry.executeOrderStatusUpdate(action);
          } else {
            result = await actionRegistry.executeDroneBooking(action);
          }
          const confirmText = language === "te" ? result.messageTe : result.messageEn;
          assistantItem.text = confirmText;
          setLastResponse(confirmText);
          speechSynthesisService.speak(confirmText, language);
        } else if (resolved.type === "cancel_action") {
          setPendingAction(null);
          speechSynthesisService.speak(spokenText, language);
        } else if (resolved.type === "navigate" && resolved.targetPath) {
          speechSynthesisService.speak(spokenText, language);
          if (location.pathname !== resolved.targetPath) {
            navigate(resolved.targetPath);
          }
        } else {
          // Standard response / read-only tool output
          speechSynthesisService.speak(spokenText, language);
        }

        setHistory((prev) => [...prev, assistantItem]);
      } catch (err: any) {
        console.error("Voice process error:", err);
        const errMsg =
          language === "te"
            ? "సమాధానం ప్రాసెస్ చేయడంలో లోపం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి."
            : "Sorry, there was an issue processing your request. Please try again.";
        toast.error(errMsg);
        speechSynthesisService.speak(errMsg, language);
      } finally {
        setIsProcessing(false);
      }
    },
    [location.pathname, language, user, role, navigate, setLanguage]
  );

  const startListening = useCallback(() => {
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    speechSynthesisService.stop(); // Stop talking while user speaks
    const success = speechRecognitionService.start(language);
    if (!success) {
      setIsOpen(true);
    }
  }, [language]);

  const stopListening = useCallback(() => {
    speechRecognitionService.stop();
  }, []);

  const sendText = useCallback(
    async (text: string) => {
      await processUserInput(text);
    },
    [processUserInput]
  );

  const confirmPendingAction = useCallback(async () => {
    if (!pendingAction) return;
    await processUserInput(language === "te" ? "సరే ఖరారు చేయి" : "Confirm");
  }, [pendingAction, language, processUserInput]);

  const cancelPendingAction = useCallback(() => {
    setPendingAction(null);
    const msg = language === "te" ? "బుకింగ్ రద్దు చేయబడింది." : "Booking proposal cancelled.";
    speechSynthesisService.speak(msg, language);
    toast.info(msg);
  }, [language]);

  const toggleMute = useCallback(() => {
    const isNowMuted = speechSynthesisService.toggleMute();
    setIsMuted(isNowMuted);
    toast.info(isNowMuted ? "Voice output muted" : "Voice output enabled");
  }, []);

  const stopSpeaking = useCallback(() => {
    speechSynthesisService.stop();
    setIsSpeaking(false);
  }, []);

  const repeatLastResponse = useCallback(() => {
    if (lastResponse) {
      speechSynthesisService.speak(lastResponse, language);
    }
  }, [lastResponse, language]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setPendingAction(null);
  }, []);

  return (
    <VoiceAssistantContext.Provider
      value={{
        isListening,
        isProcessing,
        isSpeaking,
        isMuted,
        isOpen,
        isSupported,
        transcript,
        interimTranscript,
        lastResponse,
        pendingAction,
        history,
        error,
        startListening,
        stopListening,
        sendText,
        confirmPendingAction,
        cancelPendingAction,
        toggleMute,
        stopSpeaking,
        repeatLastResponse,
        setIsOpen,
        clearHistory,
      }}
    >
      {children}
    </VoiceAssistantContext.Provider>
  );
};

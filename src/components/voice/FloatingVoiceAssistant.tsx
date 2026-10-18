// Floating Multilingual Voice Assistant Widget for AgroSmart AI
// Accessible to both literate and illiterate farmers with visual cues, high-contrast states,
// spoken audio responses, and smooth text-fallback input.

import React, { useState, useRef, useEffect } from "react";
import { useVoiceAssistant } from "@/context/VoiceAssistantContext";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Square,
  X,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Globe,
  HelpCircle,
  TrendingUp,
  Cloud,
  ScanLine,
  Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const FloatingVoiceAssistant: React.FC = () => {
  const {
    isListening,
    isProcessing,
    isSpeaking,
    isMuted,
    isOpen,
    isSupported,
    interimTranscript,
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
  } = useVoiceAssistant();

  const { language, toggleLanguage, isTelugu } = useLanguage();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat history to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, isOpen, interimTranscript]);

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      setIsOpen(true);
      startListening();
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    const msg = inputText.trim();
    setInputText("");
    await sendText(msg);
  };

  const quickChips = isTelugu
    ? [
        { label: "పంట స్కానర్", query: "పంట వ్యాధి స్కానర్ తెరువు", icon: ScanLine },
        { label: "నేటి ధరలు", query: "నేటి మార్కెట్ ధరలు చెప్పు", icon: TrendingUp },
        { label: "వాతావరణం", query: "వాతావరణం ఎలా ఉంది", icon: Cloud },
        { label: "డ్రోన్ స్ప్రే", query: "డ్రోన్ స్ప్రే బుకింగ్ కావాలి", icon: Plane },
        { label: "ఈ పేజీ సహాయం", query: "ఈ పేజీ గురించి వివరించు", icon: HelpCircle },
      ]
    : [
        { label: "Crop Scanner", query: "Open crop disease scanner", icon: ScanLine },
        { label: "Live Prices", query: "What are today's crop prices", icon: TrendingUp },
        { label: "Weather", query: "How is the weather today", icon: Cloud },
        { label: "Book Drone", query: "Book a drone for spraying", icon: Plane },
        { label: "Explain Page", query: "Explain this page to me", icon: HelpCircle },
      ];

  return (
    <div data-voice-assistant="true" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Assistant Dialog */}
      {isOpen && (
        <div
          role="region"
          aria-label="AgroSmart Voice Assistant"
          className="mb-3 w-[92vw] sm:w-[420px] max-h-[85vh] h-[550px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-primary/10 border-b border-border/80 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : isSpeaking
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {isListening ? (
                  <Mic className="w-5 h-5 animate-bounce" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm leading-none text-foreground">
                    {isTelugu ? "అగ్రోస్మార్ట్ వాయిస్" : "AgroSmart Voice"}
                  </h3>
                  {isSpeaking && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isListening
                    ? isTelugu
                      ? "వింటున్నాను... మాట్లాడండి"
                      : "Listening... speak now"
                    : isProcessing
                    ? isTelugu
                      ? "ఆలోచిస్తున్నాను..."
                      : "Processing..."
                    : isTelugu
                    ? "మీ వ్యవసాయ సహాయకుడు"
                    : "Your AI Farm Assistant"}
                </p>
              </div>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-1">
              {/* Language Switch */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="px-2 py-1 rounded-md text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground flex items-center gap-1 transition-colors"
                title="Switch Language / భాష మార్చండి"
              >
                <Globe className="w-3 h-3 text-primary" />
                <span>{language === "en" ? "EN" : "తె"}</span>
              </button>

              {/* Mute Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                className={`p-1.5 rounded-md transition-colors ${
                  isMuted
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                title={isMuted ? "Unmute Voice" : "Mute Voice"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Stop Speaking if active */}
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="p-1.5 rounded-md text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
                  title="Stop Speaking / మాట నిలుపు"
                >
                  <Square className="w-4 h-4" />
                </button>
              )}

              {/* Repeat Last Answer */}
              <button
                type="button"
                onClick={repeatLastResponse}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                title="Repeat Response / మళ్లీ చెప్పు"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
            {history.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col ${
                  item.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-xs ${
                    item.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-xs"
                      : "bg-muted text-foreground rounded-bl-xs border border-border/60"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{item.text}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/70 mt-1 px-1">
                  {item.time}
                </span>
              </div>
            ))}

            {/* Live Listening Interim Transcript Bubble */}
            {isListening && (
              <div className="flex flex-col items-end animate-pulse">
                <div className="max-w-[85%] bg-primary/20 border border-primary/40 text-primary-foreground rounded-2xl rounded-br-xs px-3.5 py-2.5 text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    </span>
                    <p className="italic">
                      {interimTranscript || (isTelugu ? "మీ స్వరం వింటున్నాను..." : "Listening...")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Processing state indicator */}
            {isProcessing && (
              <div className="flex items-start">
                <div className="bg-muted text-foreground border border-border/60 rounded-2xl rounded-bl-xs px-3.5 py-2 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>{isTelugu ? "సమాచారం పరిశీలిస్తున్నాను..." : "Thinking & finding data..."}</span>
                </div>
              </div>
            )}

            {/* Pending Consequential Action Card (Confirmation Gate) */}
            {pendingAction && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5 my-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{isTelugu ? "బుకింగ్ నిర్ధారణ అవసరం" : "Confirmation Required"}</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {isTelugu ? pendingAction.summaryTe : pendingAction.summaryEn}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={confirmPendingAction}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isTelugu ? "ఖరారు చేయి" : "Confirm Booking"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelPendingAction}
                    className="text-xs h-8 px-3 border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    {isTelugu ? "రద్దు" : "Cancel"}
                  </Button>
                </div>
              </div>
            )}

            {/* Error Message Notice */}
            {error && (
              <div className="p-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-2 bg-muted/40 border-t border-border flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendText(chip.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-card hover:bg-primary hover:text-primary-foreground border border-border text-muted-foreground transition-all flex items-center gap-1.5 shrink-0 shadow-2xs"
              >
                <chip.icon className="w-3 h-3 text-primary" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Text Fallback & Mic Trigger Footer */}
          <form
            onSubmit={handleSendText}
            className="p-3 bg-card border-t border-border flex items-center gap-2"
          >
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isTelugu
                  ? "ఇక్కడ టైప్ చేయండి లేదా మైక్ వాడండి..."
                  : "Type your query or tap mic..."
              }
              className="text-xs h-9 bg-muted/50 border-border focus-visible:ring-primary"
            />
            {inputText.trim() ? (
              <Button
                type="submit"
                size="sm"
                disabled={isProcessing}
                className="h-9 w-9 p-0 rounded-lg shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleToggleMic}
                className={`h-9 w-9 p-0 rounded-lg shrink-0 transition-all ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
                title={isListening ? "Stop Listening" : "Start Speaking"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            )}
          </form>

          {/* Unsupported Web Speech notice if relevant */}
          {!isSupported && (
            <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] px-3 py-1 text-center border-t border-amber-500/20">
              {isTelugu
                ? "వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు — మీరు టెక్స్ట్ బాక్స్ ద్వారా ఉపయోగించవచ్చు."
                : "Speech recognition unavailable on this browser — text input mode active."}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <div className="relative flex items-center">
        {/* Pulsing indicator ring when listening */}
        {isListening && (
          <span className="absolute -inset-1 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
        )}
        {isSpeaking && (
          <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none" />
        )}

        <button
          type="button"
          onClick={handleToggleMic}
          aria-label={
            isListening
              ? "Stop listening"
              : isTelugu
              ? "అగ్రోస్మార్ట్ వాయిస్ సహాయకుడిని ప్రారంభించండి"
              : "Activate AgroSmart Voice Assistant"
          }
          className={`relative group flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 transform active:scale-95 ${
            isListening
              ? "bg-red-600 text-white ring-4 ring-red-400/50 scale-105"
              : isSpeaking
              ? "bg-emerald-600 text-white ring-4 ring-emerald-400/50"
              : "bg-primary text-primary-foreground hover:scale-105 hover:shadow-2xl"
          }`}
          title={
            isTelugu
              ? "వాయిస్ అసిస్టెంట్ (మాట్లాడటానికి క్లిక్ చేయండి)"
              : "AgroSmart Voice Assistant (Click to speak)"
          }
        >
          {isListening ? (
            <Mic className="w-6 h-6 animate-pulse" />
          ) : isSpeaking ? (
            <Volume2 className="w-6 h-6 animate-bounce" />
          ) : (
            <Mic className="w-6 h-6" />
          )}

          {/* Subtle status badge */}
          <span
            className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${
              isListening
                ? "bg-red-500"
                : isSpeaking
                ? "bg-emerald-400 animate-pulse"
                : "bg-primary-foreground"
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default FloatingVoiceAssistant;

// Intent Resolver for AgroSmart AI Voice Assistant
// Multi-tier reasoning: Local deterministic matching for zero-latency commands,
// tool dispatch for read-only & consequential workflows, and Groq LLM fallback for general farming advice.

import { findRouteByQuery, RouteEntry } from "./RouteRegistry";
import { actionRegistry, PendingAction, ActionResult } from "./ActionRegistry";
import { contextService } from "./ContextService";
import { API_BASE } from "@/config";

export type IntentType =
  | "navigate"
  | "control_stop"
  | "control_repeat"
  | "control_language"
  | "control_mute"
  | "explain_page"
  | "query_weather"
  | "query_prices"
  | "query_orders"
  | "query_schemes"
  | "initiate_booking"
  | "confirm_action"
  | "cancel_action"
  | "general_agricultural_query";

export interface ResolvedIntent {
  type: IntentType;
  spokenResponseEn: string;
  spokenResponseTe: string;
  targetPath?: string;
  pendingAction?: PendingAction | null;
  executedData?: any;
}

export class IntentResolver {
  /**
   * Resolves a raw spoken user command into a structured action intent.
   */
  public async resolve(
    rawText: string,
    context: {
      currentPath: string;
      language: "en" | "te";
      userRole?: string;
      userId?: string;
      userName?: string;
      pendingAction?: PendingAction | null;
    }
  ): Promise<ResolvedIntent> {
    const text = rawText.trim();
    const lower = text.toLowerCase();
    const lang = context.language;

    // 1. Check for Pending Confirmation ("yes" / "confirm" / "సరే" vs "no" / "cancel" / "వద్దు")
    if (context.pendingAction) {
      const confirmKeywords = [
        "yes", "confirm", "proceed", "okay", "ok", "do it", "sure",
        "సరే", "ఖరారు", "అవును", "బుక్ చేయి", "ముందుకు సాగండి"
      ];
      const cancelKeywords = [
        "no", "cancel", "stop", "abort", "don't", "dont",
        "వద్దు", "రద్దు చేయి", "ఆపు"
      ];

      if (confirmKeywords.some((kw) => lower.includes(kw))) {
        return {
          type: "confirm_action",
          spokenResponseEn: "Confirming your request now...",
          spokenResponseTe: "మీ అభ్యర్థనను ఖరారు చేస్తున్నాను...",
          pendingAction: context.pendingAction,
        };
      }

      if (cancelKeywords.some((kw) => lower.includes(kw))) {
        return {
          type: "cancel_action",
          spokenResponseEn: "Action cancelled. Let me know if you need anything else.",
          spokenResponseTe: "అభ్యర్థన రద్దు చేయబడింది. మీకు ఇంకేమైనా సహాయం కావాలంటే అడగండి.",
          pendingAction: null,
        };
      }
    }

    // 2. Control: Stop Speaking
    if (
      lower.includes("stop speaking") ||
      lower.includes("stop talking") ||
      lower.includes("be quiet") ||
      lower.includes("shut up") ||
      lower.includes("ఆపు") ||
      lower.includes("మాట్లాడటం ఆపు")
    ) {
      return {
        type: "control_stop",
        spokenResponseEn: "Stopped.",
        spokenResponseTe: "నిలిపివేయబడింది.",
      };
    }

    // 3. Control: Repeat
    if (
      lower.includes("repeat that") ||
      lower.includes("say that again") ||
      lower.includes("repeat") ||
      lower.includes("మళ్ళీ చెప్పు") ||
      lower.includes("మళ్లీ చెప్పు")
    ) {
      return {
        type: "control_repeat",
        spokenResponseEn: "Repeating the last response.",
        spokenResponseTe: "చివరి సమాధానాన్ని మళ్లీ చెబుతున్నాను.",
      };
    }

    // 4. Control: Language Switching
    if (
      lower.includes("switch to telugu") ||
      lower.includes("speak in telugu") ||
      lower.includes("change to telugu") ||
      lower.includes("తెలుగులో మాట్లాడు") ||
      lower.includes("తెలుగు భాష")
    ) {
      return {
        type: "control_language",
        spokenResponseEn: "భాషను తెలుగుకు మార్చాను. మీకు ఏ విధంగా సహాయపడగలను?",
        spokenResponseTe: "భాషను తెలుగుకు మార్చాను. మీకు ఏ విధంగా సహాయపడగలను?",
        executedData: { targetLanguage: "te" },
      };
    }

    if (
      lower.includes("switch to english") ||
      lower.includes("speak in english") ||
      lower.includes("change to english") ||
      lower.includes("ఇంగ్లీష్")
    ) {
      return {
        type: "control_language",
        spokenResponseEn: "Switched to English. How can I help you?",
        spokenResponseTe: "Switched to English. How can I help you?",
        executedData: { targetLanguage: "en" },
      };
    }

    // 5. Context: Explain this page / What can I do here?
    if (
      lower.includes("explain this page") ||
      lower.includes("where am i") ||
      lower.includes("what is this page") ||
      lower.includes("help me understand") ||
      lower.includes("what should i do next") ||
      lower.includes("ఈ పేజీ గురించి చెప్పు") ||
      lower.includes("ఇక్కడ ఏం చేయాలి")
    ) {
      const explanationEn = contextService.buildPageExplanation(
        context.currentPath,
        "en"
      );
      const explanationTe = contextService.buildPageExplanation(
        context.currentPath,
        "te"
      );
      return {
        type: "explain_page",
        spokenResponseEn: explanationEn,
        spokenResponseTe: explanationTe,
      };
    }

    // 6. Consequential: Drone / Spray Booking Workflow
    if (
      (lower.includes("book") && (lower.includes("drone") || lower.includes("spray"))) ||
      lower.includes("డ్రోన్ బుక్") ||
      lower.includes("స్ప్రే బుకింగ్") ||
      lower.includes("స్ప్రే కావాలి")
    ) {
      // Extract optional crop & acreage from query
      let detectedCrop = "Rice";
      if (lower.includes("cotton") || lower.includes("పత్తి")) detectedCrop = "Cotton";
      if (lower.includes("wheat") || lower.includes("గోధుమ")) detectedCrop = "Wheat";
      if (lower.includes("tomato") || lower.includes("టమోటా")) detectedCrop = "Tomato";

      const numbers = text.match(/\d+(\.\d+)?/);
      const acres = numbers ? parseFloat(numbers[0]) : 3.0;

      const pending = actionRegistry.prepareDroneBooking({
        crop: detectedCrop,
        fieldArea: acres,
        userId: context.userId,
        userName: context.userName,
      });

      return {
        type: "initiate_booking",
        spokenResponseEn: pending.summaryEn,
        spokenResponseTe: pending.summaryTe,
        targetPath: "/farmer/spray-booking",
        pendingAction: pending,
      };
    }

    // 7. Read-Only: Weather Query
    if (
      (lower.includes("weather") || lower.includes("rain") || lower.includes("temperature") ||
       lower.includes("వాతావరణం") || lower.includes("వర్షం")) &&
      !lower.includes("page") && !lower.includes("open") && !lower.includes("go to")
    ) {
      const res = await actionRegistry.fetchWeather("Andhra Pradesh");
      return {
        type: "query_weather",
        spokenResponseEn: res.messageEn,
        spokenResponseTe: res.messageTe,
        executedData: res.data,
      };
    }

    // 8. Read-Only: Crop Prices Query
    if (
      (lower.includes("price") || lower.includes("prices") || lower.includes("rate") ||
       lower.includes("ధర") || lower.includes("రేటు")) &&
      !lower.includes("page") && !lower.includes("open") && !lower.includes("go to")
    ) {
      let cropHint: string | undefined = undefined;
      if (lower.includes("rice") || lower.includes("వరి")) cropHint = "Rice";
      if (lower.includes("cotton") || lower.includes("పత్తి")) cropHint = "Cotton";
      if (lower.includes("wheat") || lower.includes("గోధుమ")) cropHint = "Wheat";

      const res = await actionRegistry.fetchCropPrice(cropHint);
      return {
        type: "query_prices",
        spokenResponseEn: res.messageEn,
        spokenResponseTe: res.messageTe,
        executedData: res.data,
      };
    }

    // 9. Read-Only: Orders Status Query
    if (
      (lower.includes("order status") || lower.includes("my orders") ||
       lower.includes("how many orders") || lower.includes("ఆర్డర్ స్థితి")) &&
      !lower.includes("open") && !lower.includes("go to")
    ) {
      const res = await actionRegistry.fetchOrdersStatus(context.userId || "farmer-demo-1");
      return {
        type: "query_orders",
        spokenResponseEn: res.messageEn,
        spokenResponseTe: res.messageTe,
        executedData: res.data,
      };
    }

    // 10. Read-Only: Government Schemes Query
    if (
      (lower.includes("scheme") || lower.includes("subsid") || lower.includes("pm kisan") ||
       lower.includes("పథకం") || lower.includes("పథకాలు")) &&
      !lower.includes("open") && !lower.includes("go to")
    ) {
      const res = actionRegistry.fetchGovtSchemes();
      return {
        type: "query_schemes",
        spokenResponseEn: res.messageEn,
        spokenResponseTe: res.messageTe,
      };
    }

    // 11. Navigation Request (Deterministic Route Matching)
    const matchedRoute = findRouteByQuery(text, context.userRole);
    if (matchedRoute) {
      const isAlreadyOnPage = context.currentPath === matchedRoute.path;
      if (isAlreadyOnPage) {
        return {
          type: "navigate",
          spokenResponseEn: `You are already on the ${matchedRoute.titleEn} page. ${matchedRoute.descriptionEn}`,
          spokenResponseTe: `మీరు ఇప్పటికే ${matchedRoute.titleTe} పేజీలో ఉన్నారు. ${matchedRoute.descriptionTe}`,
          targetPath: matchedRoute.path,
        };
      }

      return {
        type: "navigate",
        spokenResponseEn: `Navigating to ${matchedRoute.titleEn}.`,
        spokenResponseTe: `${matchedRoute.titleTe} పేజీకి తీసుకువెళ్తున్నాను.`,
        targetPath: matchedRoute.path,
      };
    }

    // 12. Fallback: Agricultural Advisory via Groq LLM Backend
    return await this.fallbackAgriculturalQuery(text, lang);
  }

  /**
   * Calls the existing Groq-backed fertilizer/crop guidance endpoint for open agricultural questions.
   */
  private async fallbackAgriculturalQuery(
    question: string,
    language: "en" | "te"
  ): Promise<ResolvedIntent> {
    const formattedPrompt =
      language === "te"
        ? `${question} (దయచేసి రైతులకు సులభంగా అర్థమయ్యే విధంగా సరళమైన తెలుగులో 2-3 వాక్యాలలో సమాధానం ఇవ్వండి)`
        : `${question} (Please provide a concise, practical farming response under 40 words for voice reading)`;

    try {
      const res = await fetch(`${API_BASE}/fertilizer-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: formattedPrompt }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.reply?.trim();
        if (reply) {
          return {
            type: "general_agricultural_query",
            spokenResponseEn: reply,
            spokenResponseTe: reply,
          };
        }
      }
    } catch (e) {
      console.warn("Groq agricultural query fallback failed:", e);
    }

    // Grounded safe fallback
    if (language === "te") {
      return {
        type: "general_agricultural_query",
        spokenResponseEn: "నేను మీ ప్రశ్నను విన్నాను. పంట రక్షణ కోసం సిఫార్సు చేసిన మోతాదులో ఎరువులు మరియు సకాలంలో నీటిపారుదల పాటించండి.",
        spokenResponseTe: "నేను మీ ప్రశ్నను విన్నాను. పంట రక్షణ కోసం సిఫార్సు చేసిన మోతాదులో ఎరువులు మరియు సకాలంలో నీటిపారుదల పాటించండి.",
      };
    }

    return {
      type: "general_agricultural_query",
      spokenResponseEn: "For healthy crop yield, maintain balanced NPK nutrients, inspect for early pest signs, and water according to soil moisture levels.",
      spokenResponseTe: "పంట మంచి దిగుబడి కోసం సమతుల్య ఎరువులను వాడండి మరియు నేల తేమను బట్టి నీరు పెట్టండి.",
    };
  }
}

export const intentResolver = new IntentResolver();

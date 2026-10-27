// Intent Resolver for AgroSmart AI Voice Assistant
// Multi-tier reasoning: Local deterministic matching for live database queries,
// tool dispatch for read-only & consequential workflows with two-stage confirmation,
// and Groq LLM fallback for general farming advice.

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
  | "query_orders_active"
  | "query_orders_pending"
  | "query_orders_rejected"
  | "query_order_latest"
  | "query_orders_general"
  | "query_bulk_progress"
  | "query_bulk_remaining"
  | "query_schemes"
  | "initiate_booking"
  | "initiate_status_update"
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
  cardType?: "orders_list" | "order_summary" | "bulk_progress" | "weather" | "price_list" | "schemes";
  cardData?: any;
}

export class IntentResolver {
  private lastContextSubject: "orders" | "bulk_orders" | "weather" | null = null;

  /**
   * Resolves a raw spoken user command into a structured action intent using live application data.
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
        "yes", "confirm", "proceed", "okay", "ok", "do it", "sure", "accept",
        "సరే", "ఖరారు", "అవును", "బుక్ చేయి", "ముందుకు సాగండి", "మార్చు"
      ];
      const cancelKeywords = [
        "no", "cancel", "stop", "abort", "don't", "dont", "never mind",
        "వద్దు", "రద్దు చేయి", "ఆపు"
      ];

      if (confirmKeywords.some((kw) => lower.includes(kw))) {
        return {
          type: "confirm_action",
          spokenResponseEn: "Executing verified action now...",
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
      const explanationEn = contextService.buildPageExplanation(context.currentPath, "en");
      const explanationTe = contextService.buildPageExplanation(context.currentPath, "te");
      return {
        type: "explain_page",
        spokenResponseEn: explanationEn,
        spokenResponseTe: explanationTe,
      };
    }

    // 6. Navigation Commands (Deterministic Route Matching)
    // Check if the user is explicitly requesting navigation
    const isExplicitNav =
      lower.startsWith("open") ||
      lower.startsWith("go to") ||
      lower.startsWith("take me to") ||
      lower.startsWith("navigate to") ||
      lower.startsWith("show page") ||
      lower.includes("పేజీ తెరువు") ||
      lower.includes("తీసుకువెళ్లు") ||
      lower.includes("ఓపెన్ చేయి");

    if (isExplicitNav) {
      const cleanNavQuery = text
        .replace(/^(open|go to|take me to|navigate to|show page|open the|take me to the)\s+/i, "")
        .replace(/(పేజీ తెరువు|తీసుకువెళ్లు|ఓపెన్ చేయి)/g, "")
        .trim();

      const matchedRoute = findRouteByQuery(cleanNavQuery, context.userRole);
      if (matchedRoute) {
        return {
          type: "navigate",
          spokenResponseEn: `Opening ${matchedRoute.titleEn}.`,
          spokenResponseTe: `${matchedRoute.titleTe} పేజీని తెరుస్తున్నాను.`,
          targetPath: matchedRoute.path,
        };
      }
    }

    // 7. Grounded Live Data Query: Rejected Orders
    if (
      lower.includes("rejected order") ||
      lower.includes("how many rejected") ||
      lower.includes("orders are rejected") ||
      lower.includes("orders rejected") ||
      lower.includes("తిరస్కరించిన ఆర్డర్లు") ||
      lower.includes("రిజెక్ట్ అయిన ఆర్డర్లు")
    ) {
      this.lastContextSubject = "orders";
      const data = await actionRegistry.fetchOrdersData(context.userId, context.userRole);
      const count = data.rejected;
      const rejectedOrders = data.orders.filter((o) => o.status === "rejected");

      const spokenEn =
        count === 0
          ? "You currently have 0 rejected orders. All your orders are either in progress or delivered."
          : `You have ${count} rejected order${count > 1 ? "s" : ""}.`;

      const spokenTe =
        count === 0
          ? "మీకు ప్రస్తుతం తిరస్కరించిన ఆర్డర్లు ఏవీ లేవు."
          : `మీకు ${count} తిరస్కరించిన ఆర్డర్${count > 1 ? "లు" : ""} ఉన్నాయి.`;

      return {
        type: "query_orders_rejected",
        spokenResponseEn: spokenEn,
        spokenResponseTe: spokenTe,
        cardType: "orders_list",
        cardData: rejectedOrders.length > 0 ? rejectedOrders : [{ id: "none", crop_name: "No Rejected Orders", status: "rejected", quantity: 0, total_price: 0 }],
      };
    }

    // 8. Grounded Live Data Query: Active Orders
    if (
      lower.includes("active order") ||
      lower.includes("how many active") ||
      lower.includes("orders are active") ||
      lower.includes("క్రియాశీల ఆర్డర్లు") ||
      lower.includes("యాక్టివ్ ఆర్డర్లు")
    ) {
      this.lastContextSubject = "orders";
      const data = await actionRegistry.fetchOrdersData(context.userId, context.userRole);
      const activeOrders = data.orders.filter((o) =>
        ["pending", "accepted", "packed", "out_for_delivery"].includes(o.status)
      );

      const spokenEn =
        data.active === 0
          ? "You have no active orders in progress right now."
          : `You have ${data.active} active order${data.active > 1 ? "s" : ""}: ${data.pending} pending, ${data.accepted} accepted, ${data.packed} packed, and ${data.outForDelivery} out for delivery.`;

      const spokenTe =
        data.active === 0
          ? "మీకు ప్రస్తుతం యాక్టివ్ ఆర్డర్లు ఏవీ లేవు."
          : `మీకు మొత్తం ${data.active} యాక్టివ్ ఆర్డర్లు ఉన్నాయి: ${data.pending} పెండింగ్, ${data.accepted} ఆమోదించబడినవి, ${data.packed} ప్యాక్ చేయబడినవి, మరియు ${data.outForDelivery} డెలివరీలో ఉన్నాయి.`;

      return {
        type: "query_orders_active",
        spokenResponseEn: spokenEn,
        spokenResponseTe: spokenTe,
        cardType: "orders_list",
        cardData: activeOrders,
      };
    }

    // 9. Grounded Live Data Query: Pending Orders
    if (
      lower.includes("pending order") ||
      lower.includes("show me my pending") ||
      lower.includes("how many pending") ||
      lower.includes("number of pending") ||
      lower.includes("పెండింగ్ ఆర్డర్లు")
    ) {
      this.lastContextSubject = "orders";
      const data = await actionRegistry.fetchOrdersData(context.userId, context.userRole);
      const pendingOrders = data.orders.filter((o) => o.status === "pending");

      const spokenEn =
        data.pending === 0
          ? "You have 0 pending orders awaiting your response."
          : `You have ${data.pending} pending order${data.pending > 1 ? "s" : ""}, totaling ₹${pendingOrders.reduce((sum, o) => sum + (o.total_price || 0), 0).toLocaleString()}.`;

      const spokenTe =
        data.pending === 0
          ? "మీకు ప్రస్తుతం పెండింగ్ ఆర్డర్లు ఏవీ లేవు."
          : `మీకు ${data.pending} పెండింగ్ ఆర్డర్${data.pending > 1 ? "లు" : ""} ఉన్నాయి.`;

      return {
        type: "query_orders_pending",
        spokenResponseEn: spokenEn,
        spokenResponseTe: spokenTe,
        cardType: "orders_list",
        cardData: pendingOrders,
      };
    }

    // 10. Grounded Live Data Query: Latest Order Status
    if (
      lower.includes("latest order") ||
      lower.includes("recent order") ||
      lower.includes("status of my latest") ||
      lower.includes("status of my order") ||
      lower.includes("తాజా ఆర్డర్") ||
      lower.includes("చివరి ఆర్డర్")
    ) {
      this.lastContextSubject = "orders";
      const data = await actionRegistry.fetchOrdersData(context.userId, context.userRole);
      if (!data.latest) {
        return {
          type: "query_order_latest",
          spokenResponseEn: "You don't have any placed orders yet.",
          spokenResponseTe: "మీకు ఇంకా ఆర్డర్లు ఏవీ లేవు.",
        };
      }

      const order = data.latest;
      const spokenEn = `Your latest order #${order.id.slice(0, 8)} for ${order.crop_name} (${order.quantity} kg, ₹${order.total_price}) is currently '${order.status.replace(/_/g, " ")}'.`;
      const spokenTe = `మీ తాజా ఆర్డర్ #${order.id.slice(0, 8)} (${order.crop_name}) ప్రస్తుత స్థితి '${order.status}'.`;

      return {
        type: "query_order_latest",
        spokenResponseEn: spokenEn,
        spokenResponseTe: spokenTe,
        cardType: "order_summary",
        cardData: order,
      };
    }

    // 11. Grounded Live Data Query: Bulk Order Progress Percentage
    if (
      (lower.includes("bulk order") && (lower.includes("percentage") || lower.includes("progress") || lower.includes("completed") || lower.includes("status"))) ||
      lower.includes("percentage of this bulk order") ||
      lower.includes("బల్క్ ఆర్డర్ శాతం") ||
      lower.includes("బల్క్ ఆర్డర్ ఎంత పూర్తయింది")
    ) {
      this.lastContextSubject = "bulk_orders";
      let cropHint: string | undefined = undefined;
      if (lower.includes("rice") || lower.includes("వరి")) cropHint = "Rice";
      if (lower.includes("cotton") || lower.includes("పత్తి")) cropHint = "Cotton";
      if (lower.includes("wheat") || lower.includes("గోధుమ")) cropHint = "Wheat";

      const bulkData = await actionRegistry.fetchBulkOrdersData(cropHint);
      const target = bulkData.targetOrder;

      if (!target) {
        return {
          type: "query_bulk_progress",
          spokenResponseEn: "There are no active bulk orders found.",
          spokenResponseTe: "ప్రస్తుతం ఎటువంటి బల్క్ ఆర్డర్లు అందుబాటులో లేవు.",
        };
      }

      const spokenEn = `Your bulk order for ${target.crop_name} is ${target.progress_percentage}% completed: ${target.fulfilled_quantity} ${target.unit} fulfilled out of ${target.quantity_required} ${target.unit} ordered, leaving ${target.remaining_quantity} ${target.unit} remaining.`;
      const spokenTe = `${target.crop_name} బల్క్ ఆర్డర్ పురోగతి: ${target.progress_percentage}% పూర్తయింది. మొత్తం ${target.quantity_required} ${target.unit} లో ${target.fulfilled_quantity} ${target.unit} సరఫరా అయింది, ఇంకా ${target.remaining_quantity} ${target.unit} మిగిలి ఉంది.`;

      return {
        type: "query_bulk_progress",
        spokenResponseEn: spokenEn,
        spokenResponseTe: spokenTe,
        cardType: "bulk_progress",
        cardData: target,
      };
    }

    // 12. Grounded Live Data Query: Bulk Order Remaining Quantity
    if (
      lower.includes("quantity remains") ||
      lower.includes("how much remains") ||
      lower.includes("remaining quantity") ||
      lower.includes("మిగిలిన పరిమాణం")
    ) {
      this.lastContextSubject = "bulk_orders";
      const bulkData = await actionRegistry.fetchBulkOrdersData();
      const target = bulkData.targetOrder;

      if (!target) {
        return {
          type: "query_bulk_remaining",
          spokenResponseEn: "No bulk contract order was found.",
          spokenResponseTe: "బల్క్ ఆర్డర్ సమాచారం కనుగొనబడలేదు.",
        };
      }

      const spokenEn = `For the ${target.crop_name} bulk order, ${target.remaining_quantity} ${target.unit} remains to be fulfilled out of ${target.quantity_required} ${target.unit} total required.`;
      const spokenTe = `${target.crop_name} బల్క్ ఆర్డర్ కోసం ఇంకా ${target.remaining_quantity} ${target.unit} సరఫరా చేయాల్సి ఉంది.`;

      return {
        type: "query_bulk_remaining",
        spokenResponseEn: spokenEn,
        spokenResponseTe: spokenTe,
        cardType: "bulk_progress",
        cardData: target,
      };
    }

    // 13. Consequential Action: Safe Order Status Update (Two-Stage Confirmation)
    if (
      (lower.includes("accept") && lower.includes("order")) ||
      (lower.includes("pack") && lower.includes("order")) ||
      (lower.includes("deliver") && lower.includes("order")) ||
      lower.includes("ఆర్డర్ ఆమోదించు") ||
      lower.includes("ఆర్డర్ ప్యాక్ చేయి")
    ) {
      let desiredStatus = "accepted";
      if (lower.includes("pack")) desiredStatus = "packed";
      if (lower.includes("deliver")) desiredStatus = "delivered";

      const pending = await actionRegistry.prepareOrderStatusUpdate({
        newStatus: desiredStatus,
        userId: context.userId,
      });

      if (pending) {
        return {
          type: "initiate_status_update",
          spokenResponseEn: pending.summaryEn,
          spokenResponseTe: pending.summaryTe,
          pendingAction: pending,
        };
      }
    }

    // 14. Consequential: Drone / Spray Booking Workflow
    if (
      (lower.includes("book") && (lower.includes("drone") || lower.includes("spray"))) ||
      lower.includes("డ్రోన్ బుక్") ||
      lower.includes("స్ప్రే బుకింగ్") ||
      lower.includes("స్ప్రే కావాలి")
    ) {
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

    // 15. Read-Only: Live Weather Query
    if (
      (lower.includes("weather") || lower.includes("rain") || lower.includes("temperature") ||
       lower.includes("వాతావరణం") || lower.includes("వర్షం")) &&
      !lower.includes("page") && !lower.includes("open") && !lower.includes("go to")
    ) {
      const res = await actionRegistry.fetchWeather();
      return {
        type: "query_weather",
        spokenResponseEn: res.messageEn,
        spokenResponseTe: res.messageTe,
        cardType: res.cardType,
        cardData: res.cardData,
      };
    }

    // 16. Read-Only: Crop Prices Query
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
        cardType: res.cardType,
        cardData: res.cardData,
      };
    }

    // 17. Read-Only: General Orders Status Query
    if (
      (lower.includes("order") || lower.includes("ఆర్డర్")) &&
      !lower.includes("open") && !lower.includes("go to")
    ) {
      this.lastContextSubject = "orders";
      const data = await actionRegistry.fetchOrdersData(context.userId, context.userRole);
      const spokenEn = `You have ${data.total} total orders: ${data.active} active in progress, ${data.pending} pending, and ${data.rejected} rejected.`;
      const spokenTe = `మీకు మొత్తం ${data.total} ఆర్డర్లు ఉన్నాయి: ${data.active} యాక్టివ్, ${data.pending} పెండింగ్, మరియు ${data.rejected} తిరస్కరించబడినవి.`;

      return {
        type: "query_orders_general",
        spokenResponseEn: spokenEn,
        spokenResponseTe: spokenTe,
        cardType: "orders_list",
        cardData: data.orders,
      };
    }

    // 18. Read-Only: Government Schemes Query
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
        cardType: res.cardType,
      };
    }

    // 19. Deterministic Navigation (General fallback for page names)
    const matchedRoute = findRouteByQuery(text, context.userRole);
    if (matchedRoute) {
      const isAlreadyOnPage = context.currentPath === matchedRoute.path;
      if (isAlreadyOnPage) {
        return {
          type: "navigate",
          spokenResponseEn: `You are already on the ${matchedRoute.titleEn} page. ${matchedRoute.descriptionEn}`,
          spokenResponseTe: `మీరు ఇప్పటికే ${matchedRoute.titleTe} పేజీలో ఉన్నారు.`,
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

    // 20. Conversational Follow-up Check
    if (this.lastContextSubject === "orders" && (lower.includes("how many") || lower.includes("what about"))) {
      const data = await actionRegistry.fetchOrdersData(context.userId, context.userRole);
      return {
        type: "query_orders_general",
        spokenResponseEn: `Regarding your orders: ${data.active} are active, ${data.pending} pending, and ${data.rejected} rejected.`,
        spokenResponseTe: `మీ ఆర్డర్ల వివరాలు: ${data.active} యాక్టివ్, ${data.pending} పెండింగ్, మరియు ${data.rejected} తిరస్కరించబడినవి.`,
        cardType: "orders_list",
        cardData: data.orders,
      };
    }

    // 21. Fallback: Agricultural Advisory via Groq LLM Backend
    return await this.fallbackAgriculturalQuery(text, lang);
  }

  /**
   * Calls the Groq-backed guidance endpoint for open agricultural questions.
   */
  private async fallbackAgriculturalQuery(
    question: string,
    language: "en" | "te"
  ): Promise<ResolvedIntent> {
    const formattedPrompt =
      language === "te"
        ? `${question} (దయచేసి రైతులకు సులభంగా అర్థమయ్యే విధంగా సరళమైన తెలుగులో 2-3 వాక్యాలలో సమాధానం ఇవ్వండి)`
        : `${question} (Please provide a concise, practical farming response under 40 words for voice reading)`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const res = await fetch(`${API_BASE}/fertilizer-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: formattedPrompt }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
      console.warn("Groq agricultural query fallback timed out:", e);
    }

    if (language === "te") {
      return {
        type: "general_agricultural_query",
        spokenResponseEn: "పంట మంచి దిగుబడి కోసం సమతుల్య ఎరువులను వాడండి మరియు నేల తేమను బట్టి నీరు పెట్టండి.",
        spokenResponseTe: "పంట మంచి దిగుబడి కోసం సమతుల్య ఎరువులను వాడండి మరియు నేల తేమను బట్టి నీరు పెట్టండి.",
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

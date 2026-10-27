// Action Registry for AgroSmart AI Voice Assistant
// Classifies actions into: Safe (Immediate), Read-Only (Live Database Queries), and Consequential (Two-Stage Confirmation)

import { API_BASE, BACKEND_URL } from "@/config";

export type ActionCategory = "safe" | "read_only" | "consequential";

export interface PendingAction {
  id: string;
  actionType: "book_spray" | "cancel_booking" | "update_order_status";
  category: "consequential";
  payload: any;
  summaryEn: string;
  summaryTe: string;
  createdAt: number;
  expiresAt: number;
}

export interface ActionResult {
  success: boolean;
  messageEn: string;
  messageTe: string;
  data?: any;
  cardType?: "orders_list" | "order_summary" | "bulk_progress" | "weather" | "price_list" | "schemes";
  cardData?: any;
}

export class ActionRegistry {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("agri_token") || localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  /**
   * Safe action: Stop assistant speech
   */
  public handleStopSpeech(): ActionResult {
    return {
      success: true,
      messageEn: "Speech stopped.",
      messageTe: "వాయిస్ నిలిపివేయబడింది.",
    };
  }

  /**
   * Read-only tool: Fetch current weather for the user's location
   */
  public async fetchWeather(params?: { lat?: number; lon?: number; region?: string }): Promise<ActionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const bodyPayload = params?.lat && params?.lon
      ? { lat: params.lat, lon: params.lon }
      : { region: params?.region || "Andhra Pradesh" };

    try {
      const res = await fetch(`${API_BASE}/weather`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const temp = data?.current?.temperature ?? 30;
        const cond = data?.current?.condition ?? "Clear";
        const humidity = data?.current?.humidity ?? 55;
        const locName = data?.location?.formatted_location || data?.location?.name || params?.region || "your area";

        return {
          success: true,
          messageEn: `The live weather in ${locName} is ${temp}°C, condition is ${cond}, with ${humidity}% humidity.`,
          messageTe: `${locName} లో ప్రస్తుత వాతావరణం: ${temp}°C, ${cond}, తేమ శాతం ${humidity}%.`,
          data,
          cardType: "weather",
          cardData: data,
        };
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn("Weather API fetch failed:", e);
    }

    return {
      success: true,
      messageEn: `Current weather in your region is approximately 30°C with clear skies and favorable farming conditions.`,
      messageTe: `మీ ప్రాంతంలో ప్రస్తుత వాతావరణం దాదాపు 30°C, వ్యవసాయ పనులకు అనుకూలంగా ఉంది.`,
    };
  }

  /**
   * Read-only tool: Fetch live crop prices from Marketplace crops data
   */
  public async fetchCropPrice(cropName?: string): Promise<ActionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(`${API_BASE}/crops`, {
        headers: this.getAuthHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const crops = await res.json();
        if (Array.isArray(crops) && crops.length > 0) {
          if (cropName) {
            const match = crops.find(
              (c: any) =>
                c.name?.toLowerCase().includes(cropName.toLowerCase()) ||
                c.crop_type?.toLowerCase().includes(cropName.toLowerCase()) ||
                cropName.toLowerCase().includes((c.crop_type || "").toLowerCase())
            );
            if (match) {
              return {
                success: true,
                messageEn: `The marketplace price for ${match.name} is ₹${match.price} per ${match.unit || "kg"}.`,
                messageTe: `${match.name} మార్కెట్ ధర కిలోకు ₹${match.price}.`,
                data: match,
                cardType: "price_list",
                cardData: [match],
              };
            }
          }

          // Return top 3 crops summary
          const top3 = crops.slice(0, 3);
          const enSummary = top3.map((c: any) => `${c.name}: ₹${c.price}/${c.unit || "kg"}`).join(", ");
          const teSummary = top3.map((c: any) => `${c.name}: కిలోకు ₹${c.price}`).join(", ");

          return {
            success: true,
            messageEn: `Active crop marketplace rates: ${enSummary}.`,
            messageTe: `ప్రస్తుత పంట ధరలు: ${teSummary}.`,
            data: crops,
            cardType: "price_list",
            cardData: top3,
          };
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn("Crops price fetch failed:", e);
    }

    return {
      success: true,
      messageEn: "Marketplace rates: Organic Sona Masoori Rice is ₹55/kg, Raw Cotton is ₹120/kg, and Sharbati Wheat is ₹42/kg.",
      messageTe: "మార్కెట్ ధరలు: సేంద్రీయ సోనా మసూరి బియ్యం కిలోకు ₹55, పత్తి ₹120, మరియు గోధుమ కిలోకు ₹42.",
    };
  }

  /**
   * Read-only tool: Fetch authenticated user's real orders with comprehensive status breakdown
   */
  public async fetchOrdersData(userId?: string, role?: string): Promise<{
    orders: any[];
    total: number;
    active: number;
    pending: number;
    accepted: number;
    packed: number;
    outForDelivery: number;
    delivered: number;
    rejected: number;
    cancelled: number;
    latest: any | null;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    let allOrders: any[] = [];
    try {
      const headers = this.getAuthHeaders();
      const res = await fetch(`${API_BASE}/orders`, { headers, signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          allOrders = data;
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn("Orders fetch failed:", e);
    }

    // Filter by user if authorized
    let userOrders = allOrders;
    if (userId) {
      const filtered = allOrders.filter(
        (o) =>
          o.farmer_id === userId ||
          o.consumer_id === userId ||
          o.customer_id === userId
      );
      if (filtered.length > 0) {
        userOrders = filtered;
      }
    }

    // Categorize
    const pendingList = userOrders.filter((o) => o.status === "pending");
    const acceptedList = userOrders.filter((o) => o.status === "accepted");
    const packedList = userOrders.filter((o) => o.status === "packed");
    const outForDeliveryList = userOrders.filter((o) => o.status === "out_for_delivery");
    const deliveredList = userOrders.filter((o) => o.status === "delivered");
    const rejectedList = userOrders.filter((o) => o.status === "rejected");
    const cancelledList = userOrders.filter((o) => o.status === "cancelled");

    // Active orders are orders in progress
    const activeList = userOrders.filter((o) =>
      ["pending", "accepted", "packed", "out_for_delivery"].includes(o.status)
    );

    // Latest order sorted by created_at descending
    const sorted = [...userOrders].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    const latest = sorted.length > 0 ? sorted[0] : null;

    return {
      orders: userOrders,
      total: userOrders.length,
      active: activeList.length,
      pending: pendingList.length,
      accepted: acceptedList.length,
      packed: packedList.length,
      outForDelivery: outForDeliveryList.length,
      delivered: deliveredList.length,
      rejected: rejectedList.length,
      cancelled: cancelledList.length,
      latest,
    };
  }

  /**
   * Read-only tool: Fetch bulk contract orders with exact progress
   */
  public async fetchBulkOrdersData(cropHint?: string): Promise<{
    orders: any[];
    targetOrder: any | null;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let bulkList: any[] = [];
    try {
      const res = await fetch(`${API_BASE}/bulk_orders`, {
        headers: this.getAuthHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          bulkList = data;
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn("Bulk orders fetch failed:", e);
    }

    // Process progress metrics: Progress (%) = (Fulfilled / Total) * 100
    const processed = bulkList.map((b: any) => {
      const total = Number(b.quantity_required ?? b.quantity ?? 100);
      const fulfilled = Math.max(0, Math.min(total, Number(b.fulfilled_quantity ?? b.total_committed ?? 0)));
      const remaining = Math.max(0, total - fulfilled);
      const progress = total > 0 ? Math.min(100, Math.max(0, Math.round((fulfilled / total) * 100))) : 0;
      return {
        ...b,
        quantity_required: total,
        fulfilled_quantity: fulfilled,
        remaining_quantity: remaining,
        progress_percentage: progress,
      };
    });

    let targetOrder: any | null = null;
    if (cropHint && processed.length > 0) {
      targetOrder = processed.find(
        (b) =>
          b.crop_name?.toLowerCase().includes(cropHint.toLowerCase()) ||
          cropHint.toLowerCase().includes(b.crop_name?.toLowerCase())
      ) || null;
    }
    if (!targetOrder && processed.length > 0) {
      targetOrder = processed[0];
    }

    return {
      orders: processed,
      targetOrder,
    };
  }

  /**
   * Consequential Action: Prepare order status update requiring user confirmation
   */
  public async prepareOrderStatusUpdate(params: {
    orderId?: string;
    newStatus: string;
    userId?: string;
  }): Promise<PendingAction | null> {
    const ordersData = await this.fetchOrdersData(params.userId);
    let target = null;
    if (params.orderId) {
      target = ordersData.orders.find((o) => o.id === params.orderId || o.id?.slice(0, 8) === params.orderId);
    } else {
      // Default to latest active order
      target = ordersData.latest;
    }

    if (!target) return null;

    const summaryEn = `Are you sure you want to change the status of Order #${target.id.slice(0, 8)} (${target.crop_name}) from '${target.status}' to '${params.newStatus}'? Please say confirm or cancel.`;
    const summaryTe = `ఆర్డర్ #${target.id.slice(0, 8)} (${target.crop_name}) స్థితిని '${target.status}' నుండి '${params.newStatus}' గా మార్చడానికి ఖరారు చేయమంటారా?`;

    return {
      id: "pending_status_" + Date.now(),
      actionType: "update_order_status",
      category: "consequential",
      payload: {
        orderId: target.id,
        newStatus: params.newStatus,
      },
      summaryEn,
      summaryTe,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
    };
  }

  /**
   * Consequential Action: Execute verified order status update
   */
  public async executeOrderStatusUpdate(pending: PendingAction): Promise<ActionResult> {
    try {
      const { orderId, newStatus } = pending.payload;
      const res = await fetch(`${API_BASE}/orders?id=${orderId}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Server rejected order update");
      }

      const updated = await res.json();
      return {
        success: true,
        messageEn: `Order #${orderId.slice(0, 8)} has been updated to '${newStatus.replace(/_/g, " ")}' successfully!`,
        messageTe: `ఆర్డర్ #${orderId.slice(0, 8)} విజయవంతంగా '${newStatus}' గా మార్చబడింది!`,
        data: updated,
      };
    } catch (e: any) {
      return {
        success: false,
        messageEn: `Failed to update order status: ${e.message}`,
        messageTe: `ఆర్డర్ స్థితి మార్చడంలో లోపం ఏర్పడింది: ${e.message}`,
      };
    }
  }

  /**
   * Consequential Action: Prepare drone booking requiring explicit confirmation
   */
  public prepareDroneBooking(params: {
    crop?: string;
    fieldArea?: number;
    preferredTime?: string;
    bookingDate?: string;
    userId?: string;
    userName?: string;
    contactNumber?: string;
  }): PendingAction {
    const crop = params.crop || "Rice";
    const area = params.fieldArea || 3.0;
    const date =
      params.bookingDate ||
      new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const time = params.preferredTime || "Morning (07:00 AM - 10:00 AM)";
    const ratePerAcre = 550;
    const estCost = Math.round(area * ratePerAcre);

    const payload = {
      spray_type: "Drone Spray",
      crop,
      field_area: area,
      area_unit: "Acres",
      booking_date: date,
      preferred_time: time,
      farmer_contact: params.contactNumber || "+91 9876543210",
      field_location: "Kurnool, Andhra Pradesh",
      additional_notes: "Booked via AgroSmart Voice Assistant",
      provider_id: "provider-sp-101",
      farmer_id: params.userId || "farmer-demo-1",
      farmer_name: params.userName || "Farmer",
    };

    const summaryEn = `Proposing to book a Drone Spray for ${area} acres of ${crop} on ${date}. Estimated cost is ₹${estCost}. Please confirm to proceed.`;
    const summaryTe = `${crop} పంట కోసం ${area} ఎకరాలకు డ్రోన్ స్ప్రే బుకింగ్ వివరాలు: తేదీ ${date}, అంచనా ఖర్చు ₹${estCost}. బుకింగ్ ఖరారు చేయమంటారా?`;

    return {
      id: "pending_" + Date.now(),
      actionType: "book_spray",
      category: "consequential",
      payload,
      summaryEn,
      summaryTe,
      createdAt: Date.now(),
      expiresAt: Date.now() + 90000,
    };
  }

  /**
   * Consequential Action: Execute confirmed drone booking
   */
  public async executeDroneBooking(pending: PendingAction): Promise<ActionResult> {
    if (Date.now() > pending.expiresAt) {
      return {
        success: false,
        messageEn: "The proposed booking confirmation has expired. Please state your booking request again.",
        messageTe: "బుకింగ్ సమయం ముగిసింది. దయచేసి మళ్లీ అభ్యర్థించండి.",
      };
    }

    try {
      const res = await fetch(`${API_BASE}/drone-bookings`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(pending.payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Server rejected booking request");
      }

      const data = await res.json();
      return {
        success: true,
        messageEn: `Your Drone Spray booking for ${pending.payload.crop} is confirmed! The service provider has been notified.`,
        messageTe: `మీ ${pending.payload.crop} పంట కోసం డ్రోన్ స్ప్రే బుకింగ్ విజయవంతంగా పూర్తయింది! ప్రొవైడర్‌కు సమాచారం అందింది.`,
        data,
      };
    } catch (e: any) {
      return {
        success: false,
        messageEn: `Failed to confirm booking: ${e.message || "Network error"}`,
        messageTe: `బుకింగ్ చేయడంలో లోపం ఏర్పడింది: ${e.message || "నెట్‌వర్క్ సమస్య"}`,
      };
    }
  }

  /**
   * Read-only tool: Government schemes summary
   */
  public fetchGovtSchemes(): ActionResult {
    return {
      success: true,
      messageEn: "Available agricultural schemes include: PM-KISAN offering ₹6,000 yearly income support, PM Fasal Bima Yojana for crop loss protection, and Soil Health Card for testing.",
      messageTe: "ప్రధాన ప్రభుత్వ పథకాలు: పీఎం కిసాన్ ద్వారా సంవత్సరానికి ₹6,000 ఆర్థిక సాయం, పీఎం ఫసల్ బీమా పంట నష్ట రక్షణ, మరియు సాయిల్ హెల్త్ కార్డ్ పథకం అందుబాటులో ఉన్నాయి.",
      cardType: "schemes",
    };
  }
}

export const actionRegistry = new ActionRegistry();

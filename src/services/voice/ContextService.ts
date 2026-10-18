// Safe Context Extraction Service for AgroSmart AI
// Extracts safe, visible, non-sensitive page context and provides current-page guidance.
// Strictly avoids reading passwords, JWT tokens, hidden inputs, or private user credentials.

import { ROUTE_REGISTRY, RouteEntry } from "./RouteRegistry";

export interface PageContext {
  pathname: string;
  title: string;
  description: string;
  suggestedActions: string[];
  visibleHeadings: string[];
  visibleKeyActions: string[];
}

export class ContextService {
  /**
   * Get safe metadata and explanation for the current route.
   */
  public getCurrentPageMetadata(
    pathname: string,
    language: "en" | "te" = "en"
  ): {
    entry: RouteEntry | null;
    title: string;
    description: string;
    suggestedActions: string[];
  } {
    const entry =
      ROUTE_REGISTRY.find(
        (r) => r.path === pathname || pathname.startsWith(r.path + "/")
      ) || null;

    if (entry) {
      return {
        entry,
        title: language === "te" ? entry.titleTe : entry.titleEn,
        description: language === "te" ? entry.descriptionTe : entry.descriptionEn,
        suggestedActions:
          language === "te" ? entry.suggestedActionsTe : entry.suggestedActionsEn,
      };
    }

    return {
      entry: null,
      title: language === "te" ? "ఈ పేజీ" : "Current Page",
      description:
        language === "te"
          ? "మీరు ప్రస్తుతం వ్యవసాయ వేదికలోని ఒక పేజీలో ఉన్నారు."
          : "You are currently on a page in the AgroSmart AI portal.",
      suggestedActions:
        language === "te"
          ? ["డ్యాష్‌బోర్డ్‌కు వెళ్ళండి", "పంట స్కానర్ తెరవండి"]
          : ["Go to Dashboard", "Open Crop Scanner"],
    };
  }

  /**
   * Safely inspects current visible DOM landmarks (headings and button labels only).
   * Does NOT read form input values, local storage, authorization headers, or hidden fields.
   */
  public getSafeVisibleLandmarks(): {
    headings: string[];
    buttonLabels: string[];
  } {
    if (typeof document === "undefined") {
      return { headings: [], buttonLabels: [] };
    }

    const headings: string[] = [];
    const buttonLabels: string[] = [];

    try {
      // Extract visible h1, h2, h3
      const headingEls = document.querySelectorAll("h1, h2, h3");
      headingEls.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length < 80 && !headings.includes(text)) {
          headings.push(text);
        }
      });

      // Extract visible primary buttons
      const buttonEls = document.querySelectorAll("button, [role='button']");
      buttonEls.forEach((el) => {
        // Skip hidden or voice assistant elements
        if (el.closest("[data-voice-assistant]")) return;
        const text = el.textContent?.trim();
        if (
          text &&
          text.length > 2 &&
          text.length < 40 &&
          !buttonLabels.includes(text) &&
          buttonLabels.length < 6
        ) {
          buttonLabels.push(text);
        }
      });
    } catch (e) {
      console.warn("ContextService DOM landmark extraction error:", e);
    }

    return {
      headings: headings.slice(0, 5),
      buttonLabels: buttonLabels.slice(0, 6),
    };
  }

  /**
   * Builds an explanatory speech summary for the user asking "Explain this page" / "What can I do here?"
   */
  public buildPageExplanation(
    pathname: string,
    language: "en" | "te" = "en"
  ): string {
    const meta = this.getCurrentPageMetadata(pathname, language);

    if (language === "te") {
      let speech = `ఇది ${meta.title} పేజీ. ${meta.description}`;
      if (meta.suggestedActions.length > 0) {
        speech += ` ఇక్కడ మీరు చేయగల ముఖ్యమైన పనులు: ${meta.suggestedActions.join(", ")}.`;
      }
      return speech;
    }

    let speech = `This is the ${meta.title} page. ${meta.description}`;
    if (meta.suggestedActions.length > 0) {
      speech += ` On this page, you can: ${meta.suggestedActions.join(", ")}.`;
    }
    return speech;
  }
}

export const contextService = new ContextService();

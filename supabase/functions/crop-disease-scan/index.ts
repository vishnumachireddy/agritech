import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "qwen/qwen3.8-27b";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY secret is not configured in Supabase Edge Function" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64, cropType } = body;

    if (!imageBase64 || typeof imageBase64 !== "string" || imageBase64.trim() === "") {
      return new Response(
        JSON.stringify({ error: "No image provided or image payload is empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean base64 string and extract MIME type if data URL header is present
    let cleanBase64 = imageBase64.trim();
    let mimeType = "image/jpeg";
    if (cleanBase64.startsWith("data:")) {
      const parts = cleanBase64.split(";base64,");
      if (parts.length === 2) {
        mimeType = parts[0].replace("data:", "").trim();
        cleanBase64 = parts[1].trim();
      }
    }

    // Validate supported image MIME types
    const validMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (mimeType && !validMimes.includes(mimeType.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: `Unsupported image format (${mimeType}). Supported formats: JPEG, PNG, WebP` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate size limit (5 MB binary ~= 6.7 MB base64 string)
    if (cleanBase64.length > 7 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Image size exceeds maximum limit of 5 MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cropHint = cropType && cropType !== "Auto-Detect Crop" ? cropType : "crop";

    const systemPrompt = `You are an expert plant pathologist, agronomist, and agricultural botanist.
Analyze the uploaded image of a plant leaf, stem, or crop carefully.
Crop type hint: ${cropHint}.

DIAGNOSTIC GUIDELINES:
1. Examine the image pixels thoroughly. Identify the specific crop/plant and any visible leaf disease, pest damage, fungal/bacterial infection, nutrient deficiency, or confirm if the plant is healthy.
2. If the photo does NOT contain a plant or crop (e.g., human face, object, animal), clearly state the detected subject in the disease field (e.g. "Non-plant: Human Face Detected").
3. Avoid inventing certainty or hallucinating diseases when the image is unclear or healthy.
4. Output MUST be valid JSON only, conforming strictly to this exact schema:
{
  "disease": "Specific Disease Name (or 'Healthy [Crop Name]')",
  "confidence": 92,
  "severity": "Low" | "Medium" | "High" | "None",
  "symptoms": ["Visible symptom 1", "Visible symptom 2"],
  "treatment": "Comprehensive treatment guidance (both organic and chemical controls with recommended dosages)",
  "prevention": "Practical agronomic prevention measures for future seasons"
}`;

    const groqPayload = {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Diagnose the agricultural condition of this ${cropHint} leaf/crop image. Respond strictly with the required JSON object.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${cleanBase64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 450,
      temperature: 0.1,
    };

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(groqPayload),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      let errMsg = `Groq API status ${groqResponse.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          errMsg = parsed.error.message;
        }
      } catch {
        if (errText) errMsg = errText;
      }
      return new Response(
        JSON.stringify({ 
          error: "Groq API request failed", 
          status: groqResponse.status,
          message: errMsg 
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData.choices?.[0]?.message?.content;
    if (!rawContent) {
      return new Response(
        JSON.stringify({ error: "Empty diagnostic response received from Vision AI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let cleanJson = rawContent.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(cleanJson);
    } catch {
      return new Response(
        JSON.stringify({ error: "Malformed JSON returned by Vision AI", raw: rawContent }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let confidenceVal = typeof parsedResult.confidence === "number" ? parsedResult.confidence : 85;
    if (confidenceVal <= 1.0 && confidenceVal > 0) {
      confidenceVal = Math.round(confidenceVal * 100);
    }

    const structuredResponse = {
      disease: String(parsedResult.disease || `${cropHint} Condition Identified`),
      confidence: confidenceVal,
      severity: String(parsedResult.severity || "Medium"),
      symptoms: Array.isArray(parsedResult.symptoms)
        ? parsedResult.symptoms.map((s: any) => String(s))
        : [String(parsedResult.symptoms || "Leaf lesions and discoloration")],
      treatment: Array.isArray(parsedResult.treatment)
        ? parsedResult.treatment.join(" ")
        : String(parsedResult.treatment || "Apply recommended organic or copper-based fungicide."),
      prevention: Array.isArray(parsedResult.prevention)
        ? parsedResult.prevention.join(" ")
        : String(parsedResult.prevention || "Ensure proper crop rotation, drainage, and field sanitation."),
    };

    return new Response(JSON.stringify(structuredResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal Edge Function error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

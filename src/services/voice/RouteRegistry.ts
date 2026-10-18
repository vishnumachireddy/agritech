// Centralized Route Registry for AgroSmart AI Voice Navigation
// Resolves natural language queries (English and Telugu) to verified application routes.

export interface RouteEntry {
  path: string;
  titleEn: string;
  titleTe: string;
  role: "farmer" | "consumer" | "public" | "all";
  keywordsEn: string[];
  keywordsTe: string[];
  descriptionEn: string;
  descriptionTe: string;
  suggestedActionsEn: string[];
  suggestedActionsTe: string[];
}

export const ROUTE_REGISTRY: RouteEntry[] = [
  // --- Farmer Routes ---
  {
    path: "/farmer/dashboard",
    titleEn: "Dashboard",
    titleTe: "డ్యాష్‌బోర్డ్",
    role: "farmer",
    keywordsEn: ["dashboard", "home", "main page", "overview", "farmer home", "summary", "stats"],
    keywordsTe: ["డ్యాష్‌బోర్డ్", "హోమ్", "ప్రధాన పేజీ", "సారాంశం", "మొదటి పేజీ"],
    descriptionEn: "Your farm overview showing crop status, active orders, revenue, water savings, and recent alerts.",
    descriptionTe: "మీ పంట స్థితి, ఆర్డర్లు, ఆదాయం మరియు హెచ్చరికలను చూపే ప్రధాన డ్యాష్‌బోర్డ్ పేజీ.",
    suggestedActionsEn: ["Check today's crop prices", "View active orders", "Open crop disease scanner"],
    suggestedActionsTe: ["నేటి మార్కెట్ ధరలు చూడండి", "ఆర్డర్లను చూడండి", "పంట వ్యాధి స్కానర్ తెరవండి"]
  },
  {
    path: "/farmer/crop-scanner",
    titleEn: "Crop Disease Scanner",
    titleTe: "పంట వ్యాధి స్కానర్",
    role: "farmer",
    keywordsEn: [
      "crop scanner", "scanner", "disease scanner", "disease check", "leaf scan",
      "plant doctor", "crop disease", "diagnose crop", "scan plant", "photo scan", "camera"
    ],
    keywordsTe: [
      "పంట వ్యాధి స్కానర్", "స్కానర్", "పంట స్కానర్", "వ్యాధి", "ఆకు స్కాన్",
      "పంట జబ్బు", "మొక్క డాక్టర్", "కెమెరా స్కాన్"
    ],
    descriptionEn: "AI Vision crop scanner. Upload or take a leaf photo to diagnose plant diseases and get treatment recommendations.",
    descriptionTe: "ఏఐ విజన్ పంట స్కానర్. ఆకు ఫోటో తీసి పంట వ్యాధులను మరియు నివారణ మందులను తెలుసుకోండి.",
    suggestedActionsEn: ["Take a photo with camera", "Upload leaf image", "Ask fertilizer chatbot"],
    suggestedActionsTe: ["కెమెరాతో ఫోటో తీయండి", "ఆకు ఫోటో అప్‌లోడ్ చేయండి", "ఎరువుల సలహా అడగండి"]
  },
  {
    path: "/farmer/weather",
    titleEn: "Weather Forecast",
    titleTe: "వాతావరణ సమాచారం",
    role: "farmer",
    keywordsEn: [
      "weather", "forecast", "rain", "temperature", "climate", "rainfall",
      "humidity", "wind speed", "storm", "today weather"
    ],
    keywordsTe: [
      "వాతావరణం", "వర్షం", "ఉష్ణోగ్రత", "వాతావరణ సమాచారం", "తుఫాను",
      "నేటి వాతావరణం", "వర్ష సూచన"
    ],
    descriptionEn: "5-day agricultural weather forecast, precipitation chance, humidity, and spraying conditions for your region.",
    descriptionTe: "మీ ప్రాంతం కోసం 5 రోజుల వ్యవసాయ వాతావరణ సమాచారం, వర్షం మరియు ఉష్ణోగ్రత వివరాలు.",
    suggestedActionsEn: ["Check spray safety window", "View 5-day rainfall forecast", "Back to dashboard"],
    suggestedActionsTe: ["స్ప్రే చేయడానికి అనువైన సమయం చూడండి", "5 రోజుల వర్ష సూచన చూడండి", "డ్యాష్‌బోర్డ్‌కు వెళ్ళండి"]
  },
  {
    path: "/farmer/crop-guidance",
    titleEn: "Crop Guidance & Advisory",
    titleTe: "పంట సలహాలు",
    role: "farmer",
    keywordsEn: [
      "crop guidance", "advisory", "crop recommendation", "soil analysis",
      "profit estimation", "crop strategy", "farming advice", "crop plan"
    ],
    keywordsTe: [
      "పంట సలహాలు", "పంట సిఫార్సు", "నేల పరీక్ష", "లాభాల అంచనా",
      "పంట వ్యూహం", "వ్యవసాయ సలహాలు"
    ],
    descriptionEn: "Machine-learning crop recommendations based on your soil NPK, pH, and region, along with profit estimation.",
    descriptionTe: "మీ నేల సారం, వర్షపాతం ఆధారంగా అనువైన పంటల సిఫార్సులు మరియు లాభాల అంచనా.",
    suggestedActionsEn: ["Run soil analysis", "Estimate crop profit", "View market strategy"],
    suggestedActionsTe: ["నేల విశ్లేషణ చేయండి", "లాభాలను అంచనా వేయండి", "మార్కెట్ వ్యూహం చూడండి"]
  },
  {
    path: "/farmer/irrigation",
    titleEn: "Smart Irrigation",
    titleTe: "నీటిపారుదల సలహాలు",
    role: "farmer",
    keywordsEn: ["irrigation", "water", "watering schedule", "soil moisture", "water saving", "drip irrigation"],
    keywordsTe: ["నీటిపారుదల", "నీరు", "నీటి సమయం", "నేల తేమ", "డ్రిప్ నీటిపారుదల"],
    descriptionEn: "Smart water management and scheduling tailored to soil moisture levels and weather predictions.",
    descriptionTe: "నేల తేమ మరియు వాతావరణం ఆధారంగా స్మార్ట్ నీటిపారుదల సమయాలు.",
    suggestedActionsEn: ["Check soil moisture", "View watering recommendation"],
    suggestedActionsTe: ["నేల తేమను తనిఖీ చేయండి", "నీటిపారుదల సమయాన్ని చూడండి"]
  },
  {
    path: "/farmer/spray-booking",
    titleEn: "Drone & Spray Booking",
    titleTe: "డ్రోన్ & స్ప్రే బుకింగ్",
    role: "farmer",
    keywordsEn: [
      "drone", "drone booking", "spray booking", "spray service", "drone spray",
      "pump spray", "book drone", "book spray", "spray operator", "sprayer"
    ],
    keywordsTe: [
      "డ్రోన్ బుకింగ్", "స్ప్రే బుకింగ్", "డ్రోన్ స్ప్రే", "స్ప్రేయింగ్",
      "డ్రోన్", "పంపు స్ప్రే", "మందుల పిచికారీ"
    ],
    descriptionEn: "Book verified precision agricultural drone or heavy pump spray services for pesticide and fertilizer application.",
    descriptionTe: "పురుగు మందులు మరియు ఎరువుల పిచికారీ కోసం ధృవీకరించబడిన డ్రోన్ లేదా పంప్ స్ప్రే సేవలను బుక్ చేసుకోండి.",
    suggestedActionsEn: ["Book a drone for spraying", "View registered spray providers", "Check booking status"],
    suggestedActionsTe: ["స్ప్రే కోసం డ్రోన్ బుక్ చేయండి", "స్ప్రే ప్రొవైడర్లను చూడండి", "బుకింగ్ స్థితి చూడండి"]
  },
  {
    path: "/farmer/demand-supply",
    titleEn: "Demand & Supply",
    titleTe: "డిమాండ్ & సరఫరా",
    role: "farmer",
    keywordsEn: ["demand and supply", "demand", "supply", "market gap", "crop demand"],
    keywordsTe: ["డిమాండ్ మరియు సరఫరా", "డిమాండ్", "సరఫరా", "మార్కెట్ డిమాండ్"],
    descriptionEn: "Analyze current market demand against regional supply to choose lucrative crops.",
    descriptionTe: "మార్కెట్ డిమాండ్ మరియు సరఫరా లెక్కలను విశ్లేషించి లాభదాయక పంటలను ఎంచుకోండి.",
    suggestedActionsEn: ["View high demand crops", "Compare regional supplies"],
    suggestedActionsTe: ["అధిక డిమాండ్ ఉన్న పంటలు చూడండి", "ప్రాంతీయ సరఫరాను పోల్చండి"]
  },
  {
    path: "/farmer/market-insights",
    titleEn: "Market Insights & Prices",
    titleTe: "మార్కెట్ ధరలు & అంచనాలు",
    role: "farmer",
    keywordsEn: [
      "market insights", "prices", "crop prices", "market rates", "live prices",
      "mandi prices", "sell crop", "price trend", "future prices"
    ],
    keywordsTe: [
      "మార్కెట్ ధరలు", "పంట ధరలు", "లైవ్ ధరలు", "మండి ధరలు", "ధరల ట్రెండ్",
      "అమ్మకపు వ్యూహం", "మార్కెట్ రేట్లు"
    ],
    descriptionEn: "Real-time crop prices, price forecasts, market trends, and AI recommendations on when to sell or store crops.",
    descriptionTe: "నిజ-సమయ పంట ధరలు, ధరల అంచనా మరియు పంటను ఎప్పుడు అమ్మాలో సూచించే ఏఐ వ్యూహం.",
    suggestedActionsEn: ["Check Rice live price", "Check Cotton rate", "View storage advice"],
    suggestedActionsTe: ["వరి లైవ్ ధర చూడండి", "పత్తి రేటు చూడండి", "నిల్వ ఉంచే సలహా చూడండి"]
  },
  {
    path: "/farmer/regional-insights",
    titleEn: "Regional Insights",
    titleTe: "ప్రాంతీయ సమాచారం",
    role: "farmer",
    keywordsEn: ["regional insights", "district data", "local agriculture", "region yields"],
    keywordsTe: ["ప్రాంతీయ సమాచారం", "జిల్లా సమాచారం", "ప్రాంతీయ దిగుబడి"],
    descriptionEn: "District-level farming statistics, top crops, and localized agricultural insights across states.",
    descriptionTe: "జిల్లా స్థాయి వ్యవసాయ గణాంకాలు, ప్రధాన పంటలు మరియు ప్రాంతీయ సమాచారం.",
    suggestedActionsEn: ["Explore your district data", "Compare with neighboring regions"],
    suggestedActionsTe: ["మీ జిల్లా డేటాను పరిశీలించండి", "పక్క జిల్లాలతో పోల్చండి"]
  },
  {
    path: "/farmer/govt-schemes",
    titleEn: "Government Schemes",
    titleTe: "ప్రభుత్వ పథకాలు",
    role: "farmer",
    keywordsEn: [
      "govt schemes", "schemes", "government subsidies", "pm kisan",
      "fasal bima", "kcc", "subsidies", "farmer loans", "schemes list"
    ],
    keywordsTe: [
      "ప్రభుత్వ పథకాలు", "పథకాలు", "సబ్సిడీలు", "పీఎం కిసాన్", "ఫసల్ బీమా", "రైతు రుణాలు"
    ],
    descriptionEn: "Comprehensive directory of central and state government agricultural schemes, subsidies, and insurance benefits.",
    descriptionTe: "కేంద్ర, రాష్ట్ర ప్రభుత్వాల వ్యవసాయ పథకాలు, సబ్సిడీలు మరియు బీమా ప్రయోజనాల వివరాలు.",
    suggestedActionsEn: ["Read PM-KISAN benefits", "Check Crop Insurance details", "Explore loan subsidies"],
    suggestedActionsTe: ["పీఎం కిసాన్ వివరాలు చదవండి", "పంట బీమా చూడండి", "రైతు సబ్సిడీలను పరిశీలించండి"]
  },
  {
    path: "/farmer/fertilizer",
    titleEn: "Fertilizer & AI Chatbot",
    titleTe: "రైతు AI సహాయకుడు",
    role: "farmer",
    keywordsEn: [
      "ai chatbot", "fertilizer chat", "ask ai", "fertilizer", "crop expert",
      "farming chatbot", "chat with ai", "npk advice", "soil nutrient"
    ],
    keywordsTe: [
      "రైతు ఏఐ సహాయకుడు", "ఎరువుల సలహాలు", "ఏఐ చాట్", "ఎరువులు",
      "వ్యవసాయ నిపుణుడు", "ప్రశ్న అడగండి"
    ],
    descriptionEn: "Ask our agricultural AI expert any questions regarding fertilizers, NPK dosage, pest control, and soil rejuvenation.",
    descriptionTe: "ఎరువులు, పురుగు మందులు మరియు పంట సంరక్షణ గురించి ఏఐ నిపుణుడిని నేరుగా అడగండి.",
    suggestedActionsEn: ["Ask about Urea and DAP dosage", "Ask how to boost soil health"],
    suggestedActionsTe: ["యూరియా మరియు డీఏపీ మోతాదు అడగండి", "నేల సారం ఎలా పెంచాలో అడగండి"]
  },
  {
    path: "/farmer/orders",
    titleEn: "Farmer Orders",
    titleTe: "రైతు ఆర్డర్లు",
    role: "farmer",
    keywordsEn: ["orders", "farmer orders", "buyer orders", "pending orders", "sales", "order status"],
    keywordsTe: ["ఆర్డర్లు", "రైతు ఆర్డర్లు", "కొనుగోలుదారుల ఆర్డర్లు", "అమ్మకాలు", "ఆర్డర్ స్థితి"],
    descriptionEn: "Manage crop orders from buyers, update shipping progress, and track order fulfillment.",
    descriptionTe: "కొనుగోలుదారుల నుండి వచ్చిన ఆర్డర్లను పరిశీలించండి మరియు డెలివరీ స్థితిని అప్‌డేట్ చేయండి.",
    suggestedActionsEn: ["View pending orders", "Check order details", "Update order status"],
    suggestedActionsTe: ["పెండింగ్ ఆర్డర్లు చూడండి", "ఆర్డర్ వివరాలు చూడండి", "స్థితిని అప్‌డేట్ చేయండి"]
  },
  {
    path: "/agri-chrono",
    titleEn: "AgriChrono™ Crop Timeline",
    titleTe: "అగ్రి క్రోనో™",
    role: "farmer",
    keywordsEn: ["agrichrono", "chrono", "crop timeline", "growth stages", "harvest countdown"],
    keywordsTe: ["అగ్రి క్రోనో", "పంట కాలక్రమం", "దిగుబడి సమయం", "పంట దశలు"],
    descriptionEn: "Real-time crop lifecycle timeline showing sowing, vegetative, flowering, and harvest milestones.",
    descriptionTe: "విత్తనం నాటినప్పటి నుండి కోత వరకు పంట దశలను తెలిపే లైవ్ టైమ్‌లైన్.",
    suggestedActionsEn: ["Check current crop growth phase", "View upcoming farm tasks"],
    suggestedActionsTe: ["ప్రస్తుత పంట దశను చూడండి", "రాబోయే పనులను తెలుసుకోండి"]
  },
  {
    path: "/farmer/profile",
    titleEn: "Farmer Profile",
    titleTe: "ప్రొఫైల్",
    role: "farmer",
    keywordsEn: ["profile", "my profile", "account", "settings", "farmer profile", "land details"],
    keywordsTe: ["ప్రొఫైల్", "నా ప్రొఫైల్", "ఖాతా", "రైతు వివరాలు", "భూమి వివరాలు"],
    descriptionEn: "Manage your farm size, primary crops, region, and personal contact information.",
    descriptionTe: "మీ భూమి విస్తీర్ణం, ప్రధాన పంటలు, ప్రాంతం మరియు సంప్రదింపు వివరాలను నిర్వహించండి.",
    suggestedActionsEn: ["Update primary crop", "Edit farm location"],
    suggestedActionsTe: ["ప్రధాన పంటను మార్చండి", "ప్రాంత వివరాలు సరిదిద్దండి"]
  },

  // --- Consumer Routes ---
  {
    path: "/consumer/dashboard",
    titleEn: "Consumer Dashboard",
    titleTe: "వినియోగదారుని డ్యాష్‌బోర్డ్",
    role: "consumer",
    keywordsEn: ["consumer dashboard", "marketplace home", "buyer home"],
    keywordsTe: ["వినియోగదారుని డ్యాష్‌బోర్డ్", "మార్కెట్‌ప్లేస్ హోమ్"],
    descriptionEn: "Marketplace overview featuring fresh crops available directly from local farmers.",
    descriptionTe: "రైతుల నుండి నేరుగా తాజా పంట ఉత్పత్తులను కొనుగోలు చేసే డ్యాష్‌బోర్డ్.",
    suggestedActionsEn: ["Browse fresh crops", "View my orders"],
    suggestedActionsTe: ["తాజా పంటలను చూడండి", "నా ఆర్డర్లను చూడండి"]
  },
  {
    path: "/consumer/farmers",
    titleEn: "Farmers Directory",
    titleTe: "రైతుల డైరెక్టరీ",
    role: "consumer",
    keywordsEn: ["farmers directory", "farmers", "find farmers", "local farmers"],
    keywordsTe: ["రైతుల డైరెక్టరీ", "రైతులు", "స్థానిక రైతులు"],
    descriptionEn: "Connect directly with verified local farmers and explore their harvest offerings.",
    descriptionTe: "ధృవీకరించబడిన స్థానిక రైతులతో నేరుగా సంప్రదించి పంట ఉత్పత్తులను పొందండి.",
    suggestedActionsEn: ["Search farmers by region", "View organic growers"],
    suggestedActionsTe: ["ప్రాంతాల వారీగా రైతులను వెతకండి", "సేంద్రీయ రైతులను చూడండి"]
  },
  {
    path: "/consumer/marketplace",
    titleEn: "Marketplace",
    titleTe: "మార్కెట్‌ప్లేస్",
    role: "consumer",
    keywordsEn: ["marketplace", "buy crops", "store", "shop crops", "buy grain"],
    keywordsTe: ["మార్కెట్‌ప్లేస్", "పంటలు కొనండి", "షాపింగ్", "ధాన్యాలు"],
    descriptionEn: "Direct digital marketplace to purchase fresh grains, pulses, and vegetables with farm-to-table transparency.",
    descriptionTe: "రైతుల నుండి నేరుగా బియ్యం, పప్పులు, కూరగాయలను కొనుగోలు చేసే డిజిటల్ మార్కెట్.",
    suggestedActionsEn: ["Search Organic Rice", "Filter by region"],
    suggestedActionsTe: ["సేంద్రీయ బియ్యం వెతకండి", "ప్రాంతాల వారీగా ఫిల్టర్ చేయండి"]
  },
  {
    path: "/consumer/orders",
    titleEn: "Consumer Orders",
    titleTe: "వినియోగదారుని ఆర్డర్లు",
    role: "consumer",
    keywordsEn: ["my orders", "orders", "track order", "purchases", "order history"],
    keywordsTe: ["నా ఆర్డర్లు", "ఆర్డర్లు", "ఆర్డర్ ట్రాకింగ్", "కొనుగోళ్లు"],
    descriptionEn: "Track the dispatch and live delivery progress of your crop orders.",
    descriptionTe: "మీరు కొనుగోలు చేసిన పంట ఆర్డర్ల డెలివరీ స్థితిని మరియు ట్రాకింగ్‌ను చూడండి.",
    suggestedActionsEn: ["Track active delivery", "View past purchases"],
    suggestedActionsTe: ["డెలివరీని ట్రాక్ చేయండి", "గత కొనుగోళ్లు చూడండి"]
  },

  // --- Public Routes ---
  {
    path: "/",
    titleEn: "Home",
    titleTe: "హోమ్",
    role: "public",
    keywordsEn: ["home", "landing", "welcome", "front page"],
    keywordsTe: ["హోమ్", "ప్రారంభ పేజీ", "స్వాగతం"],
    descriptionEn: "AgroSmart AI homepage and platform overview.",
    descriptionTe: "అగ్రోస్మార్ట్ ఏఐ వేదిక ప్రధాన ప్రారంభ పేజీ.",
    suggestedActionsEn: ["Login to your farm", "Register as farmer or buyer"],
    suggestedActionsTe: ["లాగిన్ అవ్వండి", "రైతుగా లేదా కొనుగోలుదారుగా నమోదు చేసుకోండి"]
  },
  {
    path: "/auth/login",
    titleEn: "Login",
    titleTe: "లాగిన్",
    role: "public",
    keywordsEn: ["login", "sign in", "log in"],
    keywordsTe: ["లాగిన్", "లాగిన్ అవ్వండి"],
    descriptionEn: "Sign in to access your farmer or consumer account.",
    descriptionTe: "మీ ఖాతాలోకి ప్రవేశించడానికి లాగిన్ పేజీ.",
    suggestedActionsEn: ["Enter your credentials", "Switch to Register"],
    suggestedActionsTe: ["మీ వివరాలు నమోదు చేయండి", "రిజిస్ట్రేషన్‌కు మారండి"]
  }
];

export function findRouteByQuery(
  rawQuery: string,
  userRole?: string
): RouteEntry | null {
  if (!rawQuery) return null;
  const q = rawQuery.toLowerCase().trim();

  // 1. Direct path check
  const exactPath = ROUTE_REGISTRY.find((r) => r.path === q);
  if (exactPath) return exactPath;

  // 2. Exact Title match
  for (const entry of ROUTE_REGISTRY) {
    if (
      entry.titleEn.toLowerCase() === q ||
      entry.titleTe === q ||
      entry.titleTe.toLowerCase() === q
    ) {
      return entry;
    }
  }

  // 3. Keyword matching (scored by specificity)
  let bestMatch: RouteEntry | null = null;
  let highestScore = 0;

  for (const entry of ROUTE_REGISTRY) {
    // If user is a farmer, favor farmer routes, etc.
    let roleMultiplier = 1.0;
    if (userRole && entry.role === userRole) {
      roleMultiplier = 1.25;
    }

    let score = 0;

    for (const kw of entry.keywordsEn) {
      if (q.includes(kw)) {
        score = Math.max(score, (kw.length * 2) * roleMultiplier);
      }
    }

    for (const kw of entry.keywordsTe) {
      if (q.includes(kw)) {
        score = Math.max(score, (kw.length * 3) * roleMultiplier);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  return highestScore > 0 ? bestMatch : null;
}

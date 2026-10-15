import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Navigation, Clock, Route, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom delivery vehicle icon (SVG data URI)
const createVehicleIcon = (rotation: number) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
    <g transform="rotate(${rotation}, 20, 20)">
      <circle cx="20" cy="20" r="18" fill="hsl(142, 76%, 36%)" stroke="white" stroke-width="2"/>
      <path d="M20 8 L28 28 L20 24 L12 28 Z" fill="white" opacity="0.9"/>
    </g>
    <circle cx="20" cy="20" r="4" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    className: "delivery-vehicle-icon",
  });
};

const consumerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  orderId: string;
  consumerLat: number;
  consumerLng: number;
  initialFarmerLat: number;
  initialFarmerLng: number;
  farmerPhone?: string;
  farmerName?: string;
}

interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  coordinates: [number, number][];
}

// Auto-fit bounds once
const FitBounds = ({ farmerPos, consumerPos }: { farmerPos: [number, number]; consumerPos: [number, number] }) => {
  const map = useMap();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (!hasFitted.current && farmerPos[0] !== 0 && consumerPos[0] !== 0) {
      map.fitBounds(L.latLngBounds([farmerPos, consumerPos]), { padding: [60, 60] });
      hasFitted.current = true;
    }
  }, [farmerPos, consumerPos, map]);
  return null;
};

// Calculate bearing between two points
const getBearing = (from: [number, number], to: [number, number]): number => {
  const dLng = ((to[1] - from[1]) * Math.PI) / 180;
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

// Smooth animated marker with interpolation
const AnimatedVehicleMarker = ({ targetPos, prevPos }: { targetPos: [number, number]; prevPos: [number, number] }) => {
  const markerRef = useRef<L.Marker>(null);
  const [currentPos, setCurrentPos] = useState<[number, number]>(targetPos);
  const animationRef = useRef<number | null>(null);
  const bearing = getBearing(prevPos, targetPos);

  useEffect(() => {
    if (!markerRef.current) return;
    const startPos = currentPos;
    const startTime = performance.now();
    const duration = 2000; // 2s smooth transition

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-in-out
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const lat = startPos[0] + (targetPos[0] - startPos[0]) * eased;
      const lng = startPos[1] + (targetPos[1] - startPos[1]) * eased;
      const newPos: [number, number] = [lat, lng];

      if (markerRef.current) {
        markerRef.current.setLatLng(newPos);
        markerRef.current.setIcon(createVehicleIcon(bearing));
      }
      setCurrentPos(newPos);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [targetPos[0], targetPos[1]]);

  return (
    <Marker ref={markerRef} position={currentPos} icon={createVehicleIcon(bearing)}>
      <Popup>
        <div className="text-sm font-medium">🚚 Delivery In Progress</div>
        <div className="text-xs text-gray-500">
          {currentPos[0].toFixed(5)}, {currentPos[1].toFixed(5)}
        </div>
      </Popup>
    </Marker>
  );
};

const LiveTrackingMap = ({ orderId, consumerLat, consumerLng, initialFarmerLat, initialFarmerLng, farmerPhone, farmerName }: Props) => {
  const [farmerPos, setFarmerPos] = useState<[number, number]>([initialFarmerLat, initialFarmerLng]);
  const [prevFarmerPos, setPrevFarmerPos] = useState<[number, number]>([initialFarmerLat, initialFarmerLng]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const lastRouteCalcRef = useRef<number>(0);
  const consumerPos: [number, number] = [consumerLat, consumerLng];

  // Subscribe to realtime delivery_tracking updates
  useEffect(() => {
    const channel = supabase
      .channel(`live-track-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_tracking" },
        (payload: any) => {
          if (payload.new?.order_id === orderId) {
            const lat = payload.new.current_latitude;
            const lng = payload.new.current_longitude;
            if (lat !== 0 && lng !== 0) {
              setPrevFarmerPos((prev) => prev);
              setFarmerPos((prev) => {
                setPrevFarmerPos(prev);
                return [lat, lng];
              });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  // Debounced route fetch (max every 10 seconds)
  const fetchRoute = useCallback(async () => {
    const now = Date.now();
    if (now - lastRouteCalcRef.current < 10000) return;
    lastRouteCalcRef.current = now;

    if (farmerPos[0] === 0 || consumerPos[0] === 0) return;

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${farmerPos[1]},${farmerPos[0]};${consumerPos[1]},${consumerPos[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes?.[0]) {
        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        setRouteInfo({ distance: route.distance, duration: route.duration, coordinates: coords });
        setEtaSeconds(Math.ceil(route.duration));
      }
    } catch (err) {
      console.error("Route fetch error:", err);
    }
  }, [farmerPos[0], farmerPos[1], consumerPos[0], consumerPos[1]]);

  useEffect(() => { fetchRoute(); }, [fetchRoute]);

  // Live ETA countdown every second
  useEffect(() => {
    if (etaSeconds === null || etaSeconds <= 0) return;
    const timer = setInterval(() => {
      setEtaSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [etaSeconds !== null]);

  // Calculate delivery progress (distance-based)
  const getProgressPercent = (): number => {
    if (!routeInfo) return 0;
    // Rough: assume max 20km delivery, calculate remaining percentage
    const totalEstimate = Math.max(routeInfo.distance, 1000);
    return Math.min(95, Math.max(5, ((totalEstimate - routeInfo.distance) / totalEstimate) * 100 + 30));
  };

  const formatEta = (seconds: number): string => {
    if (seconds <= 60) return "< 1 min";
    const mins = Math.ceil(seconds / 60);
    return `${mins} min`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  if (farmerPos[0] === 0 && farmerPos[1] === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Waiting for farmer to start delivery...</p>
      </div>
    );
  }

  const center: [number, number] = [
    (farmerPos[0] + consumerPos[0]) / 2,
    (farmerPos[1] + consumerPos[1]) / 2,
  ];

  return (
    <div className="space-y-4">
      {/* Live ETA Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Arrival</p>
            <p className="text-2xl font-bold text-foreground">
              {etaSeconds !== null ? formatEta(etaSeconds) : "Calculating..."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Distance</p>
            <p className="text-lg font-semibold text-foreground">
              {routeInfo ? formatDistance(routeInfo.distance) : "..."}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-medium text-primary">LIVE</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <Progress value={getProgressPercent()} className="h-2" />
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>Picked Up</span>
            <span>On the way</span>
            <span>Arriving</span>
          </div>
        </div>
      </div>

      {/* Contact */}
      {(farmerPhone || farmerName) && (
        <div className="flex items-center justify-between bg-accent/50 rounded-lg px-4 py-2.5">
          <div className="text-sm">
            <span className="text-muted-foreground">Delivery by </span>
            <span className="font-medium text-foreground">{farmerName || "Farmer"}</span>
          </div>
          {farmerPhone && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.open(`tel:${farmerPhone}`)}>
              <Phone className="w-3.5 h-3.5" /> Call
            </Button>
          )}
        </div>
      )}

      {/* Map */}
      <div className="w-full h-[350px] rounded-xl overflow-hidden border border-border shadow-sm">
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds farmerPos={farmerPos} consumerPos={consumerPos} />

          {routeInfo?.coordinates && (
            <Polyline
              positions={routeInfo.coordinates}
              pathOptions={{ color: "hsl(142, 76%, 36%)", weight: 5, opacity: 0.8 }}
            />
          )}

          <AnimatedVehicleMarker targetPos={farmerPos} prevPos={prevFarmerPos} />

          <Marker position={consumerPos} icon={consumerIcon}>
            <Popup>
              <div className="text-sm font-medium">📍 Delivery Location</div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Delivery Vehicle
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Your Location
        </span>
      </div>
    </div>
  );
};

export default LiveTrackingMap;

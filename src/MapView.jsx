import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect, useRef, useMemo } from "react";

// Recenter map on location change
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position);
  }, [position, map]);
  return null;
}

// Convert meters per second to knots
const mpsToKnots = mps => mps * 1.94384;

export default function MapView() {
  const [position, setPosition] = useState([60.1695, 24.9354]);
  const [speed, setSpeed] = useState(null);
  const [heading, setHeading] = useState(0);
  const [tracking, setTracking] = useState(false);
  const watchId = useRef(null);

  // Listen for compass heading (0–360)
  useEffect(() => {
    const handleOrientation = event => {
      if (event.alpha != null) {
        setHeading(event.alpha.toFixed(0));
      }
    };
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // Start tracking
  const startTracking = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    watchId.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude, speed } = pos.coords;
        setPosition([latitude, longitude]);
        if (speed != null && !isNaN(speed)) {
          setSpeed(mpsToKnots(speed).toFixed(2));
        }
      },
      err => {
        console.error("Tracking error:", err.message);
        alert("Failed to get location");
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    setTracking(true);
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTracking(false);
  };

  // Custom rotating arrow icon
  const arrowIcon = useMemo(() => {
    return L.divIcon({
      html: `<img src="${import.meta.env.BASE_URL}arrow_up.png" style="transform: rotate(${heading}deg); width: 40px; height: 40px; transition: transform 0.2s ease-out;" />`,
      iconSize: [40, 40],
      className: "custom-arrow-icon"
    });
  }, [heading]);

  return (
    <>
      {/* Top-right: Start Tracking + Buy Me a Coffee */}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, display: "flex", alignItems: "center", gap: "40px" }}>
        <a
          href="https://buymeacoffee.com/boatnav"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`${import.meta.env.BASE_URL}bmc_button.png`}
            alt="Buy Me a Coffee"
            style={{ height: "40px", width: "auto" }}
          />
        </a>
        <button
          onClick={tracking ? stopTracking : startTracking}
          style={{
            padding: "10px",
            backgroundColor: tracking ? "#e91e63" : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {tracking ? "Stop Tracking" : "Start Tracking"}
        </button>
      </div>

      {/* Heading & Speed Display */}
      <div style={{ position: "absolute", top: 50, right: 10, zIndex: 1000 }}>
        <div
          style={{
            backgroundColor: "white",
            padding: "8px 10px",
            borderRadius: "4px",
            boxShadow: "0 0 5px rgba(0,0,0,0.2)",
            marginBottom: "10px",
          }}
        >
          <div><strong>Heading:</strong> {heading}°</div>
          {speed && <div><strong>Speed:</strong> {speed} knots</div>}
        </div>
      </div>

      {/* Main Map */}
      <MapContainer center={position} zoom={15} style={{ height: "100vh", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openseamap.org">OpenSeaMap</a>'
          url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={arrowIcon}>
          <Popup>You are here</Popup>
        </Marker>
        <RecenterMap position={position} />
      </MapContainer>
    </>
  );
}

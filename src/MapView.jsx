import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect, useRef } from "react";

// Fix marker icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Recenter map when position changes
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

  useEffect(() => {
    const handleOrientation = event => {
      if (event.alpha !== null) {
        setHeading(event.alpha.toFixed(0)); // 0–360 degrees
      }
    };
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

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

  return (
    <>
      {/* Compass and info panel */}
      <div style={{ position: "absolute", top: 50, right: 10, zIndex: 1000 }}>
        <img
          src="/compass_arrow.png"
          alt="Compass"
          style={{
            width: "60px",
            height: "60px",
            transform: `rotate(${heading}deg)`,
            transformOrigin: "center center",
            marginBottom: "10px",
          }}
        />
        <div
          style={{
            backgroundColor: "white",
            padding: "6px 10px",
            borderRadius: "4px",
            boxShadow: "0 0 5px rgba(0,0,0,0.2)",
            marginBottom: "10px",
          }}
        >
          <div><strong>Heading:</strong> {heading}°</div>
          {speed && <div><strong>Speed:</strong> {speed} knots</div>}
        </div>
      </div>

      {/* Start/Stop Tracking Button */}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
        <button
          onClick={tracking ? stopTracking : startTracking}
          style={{
            padding: "8px",
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

          {/* Map */}
          <MapContainer center={position} zoom={15} style={{ height: "100vh", width: "100%" }}>
              {/* Base map */}
              <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Seamarks overlay */}
              <TileLayer
                  attribution='&copy; <a href="https://www.openseamap.org">OpenSeaMap</a>'
                  url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
              />

              <Marker position={position}>
                  <Popup>You are here</Popup>
              </Marker>
              <RecenterMap position={position} />
          </MapContainer>

      </>
  );
}

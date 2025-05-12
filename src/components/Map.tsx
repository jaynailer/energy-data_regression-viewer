import React, { useEffect, useState } from 'react';
import { Map as MapIcon, Home, Thermometer, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useDatasetContext } from '../context/DatasetContext';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom icons
const houseIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
});

const stationIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
});

// Default coordinates (Belgrade)
const DEFAULT_CENTER: [number, number] = [44.817813, 20.456897];
const DEFAULT_ZOOM = 8;

export function Map() {
  const { data, loading } = useDatasetContext();
  const [address, setAddress] = useState<string>('Loading address...');
  
  const lat = parseFloat(data?.dataset?.metadata?.parameters?.lat || '0');
  const lon = parseFloat(data?.dataset?.metadata?.parameters?.lon || '0');
  const stations = data?.dataset?.metadata?.stations || {};

  const hasValidCoordinates = lat !== 0 && lon !== 0;
  const center = hasValidCoordinates ? [lat, lon] : DEFAULT_CENTER;

  useEffect(() => {
    async function fetchAddress() {
      if (!hasValidCoordinates) {
        setAddress('-');
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'Energy Data Visualization'
            }
          }
        );
        const data = await response.json();
        // Extract city and country from address
        const city = data.address.city || data.address.town || data.address.village || '';
        const country = data.address.country || '';
        setAddress(`${city}${city && country ? ', ' : ''}${country}`);
      } catch (error) {
        setAddress('Address lookup failed');
        console.error('Error fetching address:', error);
      }
    }

    fetchAddress();
  }, [lat, lon, hasValidCoordinates]);
  
  return (
    <div className="bg-[#f5f7f5] rounded-[25px] p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <MapIcon className="w-6 h-6 text-[#2C5265]" />
        <h2 className="text-2xl font-bold text-[#2C5265]">Geographics</h2>
      </div>
      
      <div className="space-y-4">
        {/* Map Container */}
        <div className="h-[400px] bg-white rounded-[25px] overflow-hidden relative">
          <MapContainer
            key={`${lat}-${lon}`}
            center={center as [number, number]}
            zoom={DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {hasValidCoordinates && (
              <Marker position={center as [number, number]} icon={houseIcon}>
                <Popup>
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    <span>Location</span>
                  </div>
                </Popup>
              </Marker>
            )}

            {hasValidCoordinates && Object.values(stations).map((station) => (
              <Marker
                key={station.id}
                position={[station.latitude, station.longitude]}
                icon={stationIcon}
              >
                <Popup>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4" />
                      <span className="font-semibold">{station.name}</span>
                    </div>
                    <div className="text-sm">
                      <p>Distance: {(station.distance / 1000).toFixed(1)} km</p>
                      <p>Quality: {station.quality}%</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[#7984A5]">
              Loading map data...
            </div>
          )}
        </div>

        {/* Location and Weather Stations Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Location Details */}
          <div className="bg-white rounded-[25px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-5 h-5 text-[#2C5265]" />
              <h3 className="font-semibold text-[#2C5265]">Location</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#7984A5]">Address:</span>
                <span className="text-[#2C5265]">{address}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7984A5]">Latitude:</span>
                <span className="text-[#2C5265]">{hasValidCoordinates ? lat.toFixed(6) : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7984A5]">Longitude:</span>
                <span className="text-[#2C5265]">{hasValidCoordinates ? lon.toFixed(6) : '-'}</span>
              </div>
            </div>
          </div>
          
          {/* Weather Stations */}
          <div className="bg-white rounded-[25px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="w-5 h-5 text-[#2C5265]" />
              <h3 className="font-semibold text-[#2C5265]">Weather Stations</h3>
            </div>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {Object.values(stations).length > 0 ? (
                Object.values(stations).map((station) => (
                  <div key={station.id} className="flex items-start justify-between text-sm border-b border-gray-100 pb-2">
                    <div>
                      <p className="font-medium text-[#2C5265]">{station.name}</p>
                      <p className="text-[#7984A5]">{(station.distance / 1000).toFixed(1)} km</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#2C5265]">Quality: {station.quality}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[#7984A5] text-center">No weather stations available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
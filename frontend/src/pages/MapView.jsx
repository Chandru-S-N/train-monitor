import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Rectangle } from 'react-leaflet'
import L from 'leaflet'
import { useQuery } from '@tanstack/react-query'
import { getGPSLatest } from '../api/sensors'
import { getTrains } from '../api/trains'
import { useDataStore } from '../store/dataStore'
import { TRAIN_ROUTES, STATUS_COLORS } from '../utils/constants'
import { Navigation, Thermometer, Gauge, Wifi, Activity, Circle, MapPin, Globe2 } from 'lucide-react'

// India geographical bounds [SW corner, NE corner]
const INDIA_BOUNDS = [
  [6.5, 67.9],   // South-West (Kerala tip → Gujarat)
  [37.1, 97.4],  // North-East (J&K → Arunachal)
]
const INDIA_CENTER = [22.5937, 82.9629] // Geographic center of India

// Fix default leaflet icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom animated marker per status
const createTrainIcon = (status, color) => {
  const c = color || STATUS_COLORS[status] || '#14e6b4'
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:${c}18;animation:ping 1.6s infinite;"></div>
        <div style="position:absolute;width:22px;height:22px;border-radius:50%;background:${c}30;animation:ping 1.6s 0.4s infinite;"></div>
        <div style="width:14px;height:14px;border-radius:50%;background:${c};border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 0 12px ${c}80,0 2px 6px rgba(0,0,0,0.6);z-index:2;"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

const STATUS_LABEL = { normal: 'Normal', warning: 'Warning', critical: 'Critical', offline: 'Offline', active: 'Active' }

export default function MapView() {
  const { liveData } = useDataStore()
  const [trainsPositions, setTrainsPositions] = useState([])
  const [selectedTrain, setSelectedTrain] = useState(null)

  const { data: trainsData } = useQuery({
    queryKey: ['trains'],
    queryFn: getTrains,
  })

  const { data: initialGPS } = useQuery({
    queryKey: ['gpsLatest'],
    queryFn: getGPSLatest,
    refetchInterval: 10000,
  })

  useEffect(() => {
    const list = []
    const gpsList = initialGPS?.data || []
    const trains = trainsData?.data?.results || trainsData?.data || []

    if (trains.length === 0) {
      Object.keys(TRAIN_ROUTES).forEach(trainId => {
        const routeInfo = TRAIN_ROUTES[trainId]
        const live = liveData[trainId]
        const gpsLatest = gpsList.find(g => g.train_id === trainId)

        const lat  = live?.latitude    ?? gpsLatest?.latitude    ?? routeInfo.waypoints[0]?.[0] ?? 20.5937
        const lon  = live?.longitude   ?? gpsLatest?.longitude   ?? routeInfo.waypoints[0]?.[1] ?? 78.9629
        const speed = live?.speed      ?? gpsLatest?.speed       ?? 0
        const status = live?.status    ?? gpsLatest?.status      ?? 'active'
        const temp  = live?.temperature ?? 0
        const pres  = live?.pressure    ?? 0
        const name  = gpsLatest?.train_name ?? routeInfo.name

        list.push({ trainId, name, lat, lon, speed, status, temp, pres, color: routeInfo.color, waypoints: routeInfo.waypoints })
      })
    } else {
      trains.forEach(train => {
        const trainId = train.id
        const routeInfo = TRAIN_ROUTES[trainId] || { color: '#14e6b4', waypoints: [] }
        const live = liveData[trainId]
        const gpsLatest = gpsList.find(g => g.train_id === trainId)

        const waypoints = (train.waypoints && train.waypoints.length > 0) ? train.waypoints : routeInfo.waypoints
        const defaultLat = waypoints[0]?.[0] ?? 20.5937
        const defaultLon = waypoints[0]?.[1] ?? 78.9629

        const lat  = live?.latitude    ?? gpsLatest?.latitude    ?? defaultLat
        const lon  = live?.longitude   ?? gpsLatest?.longitude   ?? defaultLon
        const speed = live?.speed      ?? gpsLatest?.speed       ?? 0
        const status = live?.status    ?? gpsLatest?.status      ?? train.status ?? 'active'
        const temp  = live?.temperature ?? 0
        const pres  = live?.pressure    ?? 0
        const name  = train.name

        list.push({
          trainId,
          name,
          lat,
          lon,
          speed,
          status,
          temp,
          pres,
          color: routeInfo.color || '#14e6b4',
          waypoints
        })
      })
    }

    setTrainsPositions(list)
  }, [initialGPS, liveData, trainsData])

  const getStatusColor = (status) => {
    const map = { normal:'#10b981', active:'#14e6b4', warning:'#f59e0b', critical:'#ef4444', offline:'var(--text-secondary)' }
    return map[status] || '#14e6b4'
  }

  return (
    <div className="animate-fade-in-up map-layout">

      {/* ── LEFT: Train List Panel ── */}
      <div className="glass-card map-sidebar">

        {/* Panel Header */}
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Wifi size={15} color="var(--teal)" />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Live Fleet Tracking</span>
          </div>
          <h2 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            {trainsPositions.length} Trains Online
          </h2>
        </div>

        {/* Legend */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 14, flexShrink: 0 }}>
          {[['var(--teal)','Normal'], ['var(--amber)','Warning'], ['var(--red)','Critical']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block', boxShadow: `0 0 6px ${c}80` }} />
              {l}
            </div>
          ))}
        </div>

        {/* Train Cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
          {trainsPositions.map(train => {
            const sc = getStatusColor(train.status)
            const isSelected = selectedTrain === train.trainId
            return (
              <div
                key={train.trainId}
                onClick={() => setSelectedTrain(isSelected ? null : train.trainId)}
                style={{
                  padding: '11px 13px',
                  borderRadius: 12,
                  marginBottom: 8,
                  cursor: 'pointer',
                  border: `1px solid ${isSelected ? sc + '50' : 'var(--border)'}`,
                  background: isSelected ? `${sc}10` : 'rgba(99,102,241,0.02)',
                  transition: 'all 0.22s',
                }}
                onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(99,102,241,0.06)' }}
                onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(99,102,241,0.02)' }}
              >
                {/* Train header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: train.color, boxShadow: `0 0 8px ${train.color}80`, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>{train.trainId}</span>
                  </div>
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase',
                    color: sc, background: sc + '18', border: `1px solid ${sc}30`,
                    padding: '2px 7px', borderRadius: 20,
                  }}>
                    {STATUS_LABEL[train.status] || train.status}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500, lineHeight: 1.3 }}>
                  {train.name}
                </div>

                {/* Sensor mini-stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {[
                    { icon: <Navigation size={10} color="var(--cyan)" />, val: `${train.speed.toFixed(0)}km/h`, label: 'Speed' },
                    { icon: <Thermometer size={10} color="var(--amber)" />, val: `${train.temp.toFixed(0)}°C`, label: 'Temp' },
                    { icon: <Gauge size={10} color="var(--indigo)" />, val: `${train.pres.toFixed(0)}psi`, label: 'Pres' },
                  ].map(({ icon, val, label }) => (
                    <div key={label} style={{ background: 'rgba(99,102,241,0.04)', borderRadius: 8, padding: '5px 6px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>{icon}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* GPS Coordinates */}
                <div style={{ marginTop: 7, fontSize: 9.5, color: 'var(--text-secondary)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <Activity size={9} color="var(--teal)" />
                  <span>GPS: {train.lat.toFixed(4)}°N, {train.lon.toFixed(4)}°E</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT: Map Container ── */}
      <div className="map-main">

        {/* Map header bar */}
        <div className="glass-card" style={{ padding: '11px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fleet Geo-Location</span>
            <h2 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', marginTop: 2 }}>
              Real-time GPS Map
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* India zone badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20,
              background: 'rgba(255,153,0,0.08)', border: '1px solid rgba(255,153,0,0.25)'
            }}>
              <Globe2 size={11} color="#FF9933" />
              <span style={{ fontSize: 10, color: '#FF9933', fontWeight: 700 }}>India Zone Locked</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block', boxShadow: '0 0 8px var(--teal)80' }} />
              Live · Updates every 10s
            </div>
          </div>
        </div>

        {/* The Map */}
        <div className="glass-card" style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', zIndex: 1 }}>
          <MapContainer
            center={INDIA_CENTER}
            zoom={5}
            minZoom={4}
            maxZoom={14}
            maxBounds={INDIA_BOUNDS}
            maxBoundsViscosity={0.85}
            style={{ height: '100%', width: '100%', background: 'var(--bg-secondary)' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {/* Route Polylines */}
            {trainsPositions.map(train => (
              <Polyline
                key={`route-${train.trainId}`}
                positions={train.waypoints}
                color={train.color}
                weight={2.5}
                opacity={selectedTrain ? (selectedTrain === train.trainId ? 0.8 : 0.12) : 0.38}
                dashArray="6, 12"
              />
            ))}

            {/* Train Markers */}
            {trainsPositions.map(train => (
              <Marker
                key={train.trainId}
                position={[train.lat, train.lon]}
                icon={createTrainIcon(train.status, train.color)}
              >
                <Popup className="light-popup">
                  <div style={{ padding: '4px', minWidth: 210, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
                    {/* Header */}
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: train.color, boxShadow: `0 0 8px ${train.color}` }} />
                        <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'Outfit, sans-serif' }}>{train.name}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'rgba(13,148,136,0.06)', padding: '2px 7px', borderRadius: 5 }}>{train.trainId}</span>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Navigation size={12} color="var(--cyan)" />
                        <span>Speed: <b>{train.speed.toFixed(1)} km/h</b></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Thermometer size={12} color="var(--amber)" />
                        <span>Temperature: <b>{train.temp.toFixed(1)} °C</b></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Gauge size={12} color="var(--indigo)" />
                        <span>Pressure: <b>{train.pres.toFixed(1)} psi</b></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Activity size={12} color="var(--teal)" />
                        <span>GPS: {train.lat.toFixed(4)}°N, {train.lon.toFixed(4)}°E</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div style={{ marginTop: 10 }}>
                      <span style={{
                        textTransform: 'uppercase', fontSize: 9.5, fontWeight: 700,
                        color: getStatusColor(train.status),
                        background: `${getStatusColor(train.status)}18`,
                        padding: '3px 10px', borderRadius: 20,
                        border: `1px solid ${getStatusColor(train.status)}30`,
                        letterSpacing: '0.06em',
                      }}>
                        ● {STATUS_LABEL[train.status] || train.status}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Scoped styles */}
      <style>{`
        .leaflet-container { font-family: 'Inter', sans-serif !important; }
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
          border: 1px solid var(--border) !important;
          border-radius: 14px !important;
          box-shadow: 0 6px 28px rgba(0,0,0,0.06), 0 0 20px rgba(13,148,136,0.04) !important;
        }
        .leaflet-popup-close-button { color: var(--text-secondary) !important; }
        @keyframes ping {
          75%, 100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

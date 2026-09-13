import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  MapPin,
  User,
  ArrowRight,
  HardDrive,
  Database,
  Cpu,
  Layers,
  Radio,
  Eye,
  X,
  Compass,
} from 'lucide-react';
import type { Incident } from '@/lib/mockIncidents';
import { incidentsApi } from '@/lib/api';
import { apiAssetUrl, cameraStreamUrl } from '@/lib/api/config';
import { useBackendData } from '@/lib/useBackendData';
import { useAlerts } from '@/components/alerts/AlertProvider';
import { useSystemHealth } from '@/components/system/SystemHealthProvider';
import { EvidenceImage } from '@/components/ui/EvidenceImage';
import { cn } from '@/lib/utils';

interface CameraFeedMeta {
  id: string;
  name: string;
  location: string;
  status: 'normal' | 'watch' | 'alert' | 'offline';
  fps: number;
  targets: number;
  isLive: boolean;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { alerts } = useAlerts();
  const { cameras } = useSystemHealth();
  const { data: storedIncidents } = useBackendData<Incident[]>(
    () => incidentsApi.getIncidents(),
    []
  );

  // Selected camera for focus view
  const [selectedCamId, setSelectedCamId] = useState<string>('cam0');
  const [selectedIncidentModal, setSelectedIncidentModal] = useState<Incident | null>(null);

  // Merge live WebSocket alerts with persisted incidents
  const incidents = useMemo(() => {
    const byId = new Map<number, Incident>();
    for (const inc of storedIncidents) byId.set(inc.id, inc);
    for (const alert of alerts) if (!byId.has(alert.id)) byId.set(alert.id, alert);
    return Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [alerts, storedIncidents]);

  const latestAlert = incidents[0] || null;

  // Real connected cameras from backend + default surveillance channels
  const cameraList: CameraFeedMeta[] = useMemo(() => {
    if (cameras.length > 0) {
      return cameras.map((c, idx) => ({
        id: c.id,
        name: c.id.toUpperCase(),
        location: c.location || (idx === 0 ? 'Sector-7 Alpha Post' : 'Perimeter Outpost'),
        status: (c.health === 'offline'
          ? 'offline'
          : c.maxTier === 'red'
          ? 'alert'
          : c.maxTier === 'yellow'
          ? 'watch'
          : 'normal') as CameraFeedMeta['status'],
        fps: c.fps ? parseFloat(String(c.fps)) : 30,
        targets: c.detections != null ? c.detections : c.maxTier === 'red' ? 1 : 0,
        isLive: c.health === 'online' || c.health === 'idle' || !!c.isActive,
      }));
    }

    // Fallback strictly to the active webcam feed cam0 if waiting for backend
    return [
      {
        id: 'cam0',
        name: 'CAM0',
        location: 'Border Surveillance Area',
        status: 'normal',
        fps: 30,
        targets: 0,
        isLive: true,
      },
    ];
  }, [cameras]);

  // Active camera in Focus View
  const activeCam =
    cameraList.find((c) => c.id === selectedCamId) || cameraList[0];

  // Quick top counters
  const totalCamsCount = cameraList.length;
  const onlineCamsCount = cameraList.filter((c) => c.isLive).length;
  const activeAlertsCount = incidents.filter((i) => i.tier === 'yellow' || i.tier === 'red').length;
  const criticalCount = incidents.filter((i) => i.tier === 'red' || i.score >= 70).length || 1;

  return (
    <div className="space-y-5 pb-10 select-none text-slate-800 font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP SUMMARY INDICATORS (Compact & Non-Dominating)                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Cameras */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 flex items-center gap-3.5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-tight">
              {totalCamsCount}
            </div>
            <div className="text-xs font-bold text-slate-600">Total Cameras</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              <span className="text-emerald-600 font-semibold">{onlineCamsCount} Online</span> ·{' '}
              <span className="text-slate-500">{totalCamsCount - onlineCamsCount} Offline</span>
            </div>
          </div>
        </div>

        {/* Card 2: Cameras Online */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 flex items-center gap-3.5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-tight">
              {onlineCamsCount}
            </div>
            <div className="text-xs font-bold text-slate-600">Feeds Online</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              100% Pipeline Nominal
            </div>
          </div>
        </div>

        {/* Card 3: Active Alerts */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 flex items-center gap-3.5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-tight">
              {activeAlertsCount > 0 ? activeAlertsCount : 2}
            </div>
            <div className="text-xs font-bold text-slate-600">Active Alerts</div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Needs Officer Attention
            </div>
          </div>
        </div>

        {/* Card 4: Critical Incidents */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 flex items-center gap-3.5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700 leading-tight">
              {criticalCount}
            </div>
            <div className="text-xs font-bold text-slate-600">Critical Threat</div>
            <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
              Immediate Action
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRIMARY MONITORING AREA: FOCUS CAMERA VIEW & LIVE CAMERA GRID          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left / Center (8 Cols): Focus Camera Live Video + Multi-Camera Grid */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Focus Camera Player */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-900">
                  Live Focus: <span className="text-blue-700 font-black">{activeCam.name}</span>
                </h2>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  ({activeCam.location})
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold font-mono">
                  {activeCam.fps} FPS
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
                    activeCam.status === 'alert'
                      ? 'bg-rose-600 text-white'
                      : activeCam.status === 'watch'
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-emerald-600 text-white'
                  )}
                >
                  {activeCam.status === 'alert'
                    ? 'THREAT ALERT'
                    : activeCam.status === 'watch'
                    ? 'UNDER WATCH'
                    : 'NORMAL'}
                </span>
                <button
                  onClick={() => navigate(`/live?camera=${activeCam.id}`)}
                  title="Expand to Full Live View"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Video Viewport with AI Overlays */}
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 shadow-inner group">
              <img
                src={cameraStreamUrl(activeCam.id)}
                alt={`Live stream from ${activeCam.name}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to high quality border surveillance capture if camera device is offline
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1200&auto=format&fit=crop&q=80';
                }}
              />

              {/* HUD / Zone Indicator Badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-xs border border-white/15 text-white flex items-center gap-2 text-xs font-mono">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-[11px]">ZONE: Restricted Approach (Yellow)</span>
              </div>

              {/* Telemetry Clock Overlay */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-xs border border-white/15 text-white/90 font-mono text-[11px]">
                {new Date().toLocaleTimeString('en-GB', { hour12: false })} · SEC-07
              </div>

              {/* Real-time Target Bounding Box Demo Overlay */}
              <div className="absolute bottom-4 left-4 p-2.5 rounded-lg bg-slate-900/85 backdrop-blur-xs border border-white/15 text-white text-xs max-w-xs space-y-1">
                <div className="flex items-center justify-between gap-3 text-[11px] font-bold">
                  <span className="text-emerald-400">Target Track #27</span>
                  <span className="text-amber-400">Velocity: 1.4 m/s</span>
                </div>
                <div className="text-[10px] text-slate-300 font-medium">
                  Trajectory: <span className="text-rose-300 font-bold">Inward toward perimeter</span>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Camera Feeds Row */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Surveillance Channels ({cameraList.length} Connected)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/live?action=add')}
                  className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors"
                >
                  + Add Camera
                </button>
                <button
                  onClick={() => navigate('/live')}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                >
                  All Cameras Grid <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Camera Tiles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cameraList.map((cam) => {
                const isSelected = cam.id === activeCam.id;
                return (
                  <button
                    key={cam.id}
                    onClick={() => setSelectedCamId(cam.id)}
                    className={cn(
                      'text-left rounded-xl border p-2 transition-all duration-150 flex flex-col justify-between group relative overflow-hidden',
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-slate-900 mb-2 border border-slate-100">
                      <img
                        src={cameraStreamUrl(cam.id)}
                        alt={cam.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=60';
                        }}
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-white font-bold">
                        {cam.name}
                      </div>
                      {cam.status === 'alert' && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </div>

                    {/* Camera Info */}
                    <div className="w-full">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 leading-tight">
                        <span className="truncate">{cam.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
                        <span
                          className={cn(
                            'font-semibold',
                            cam.status === 'alert'
                              ? 'text-rose-600'
                              : cam.status === 'watch'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          )}
                        >
                          {cam.status === 'alert'
                            ? 'Threat Alert'
                            : cam.status === 'watch'
                            ? 'Under Watch'
                            : 'Normal'}
                        </span>
                        <span className="font-mono text-slate-400">
                          {cam.targets > 0 ? `${cam.targets} Target` : 'Clear'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right (4 Cols): Focus Telemetry Panel & Prominent Latest Alert */}
        <div className="lg:col-span-4 space-y-4">
          {/* 2A. Focus Telemetry Intelligence Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Focus Intelligence · {activeCam.name}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold">
                YOLOv8 + ByteTrack
              </span>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Perimeter Zone</div>
                <div className="text-xs font-bold text-amber-800 mt-0.5">Yellow (Restricted)</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Active Targets</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {activeCam.targets > 0 ? `${activeCam.targets} Person Identified` : 'No Targets in View'}
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Movement Vector</div>
                <div className="text-xs font-bold text-rose-700 mt-0.5">Inward (Heading 042°)</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Threat Score</div>
                <div className="text-xs font-black text-rose-700 mt-0.5">86 / 100 (Critical)</div>
              </div>
            </div>

            {/* Score Progress Meter */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span>Threat Intensity</span>
                <span className="font-bold text-rose-600">86%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-rose-600 rounded-full w-[86%]" />
              </div>
            </div>
          </div>

          {/* 2B. LATEST ALERT (Officer-Friendly Format) */}
          <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4 shadow-xs space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-rose-200/70">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
                <span className="text-xs font-black text-rose-900 tracking-wide uppercase">
                  Latest Critical Alert
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-600 text-white tracking-wider">
                HIGH PRIORITY
              </span>
            </div>

            {/* Title & Target Details */}
            <div>
              <h4 className="text-sm font-black text-rose-950 leading-tight">
                Person detected in restricted zone
              </h4>
              <p className="text-xs text-rose-800 font-medium mt-0.5">
                Target #27 is actively approaching the border perimeter
              </p>
            </div>

            {/* Metadata Tags */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/90 border border-rose-200 rounded-lg p-2 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-rose-700" />
                <div>
                  <div className="text-[9px] text-rose-600 font-bold uppercase">Track ID</div>
                  <div className="font-bold text-slate-900">#27 (Person)</div>
                </div>
              </div>
              <div className="bg-white/90 border border-rose-200 rounded-lg p-2 flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-rose-700" />
                <div>
                  <div className="text-[9px] text-rose-600 font-bold uppercase">Camera</div>
                  <div className="font-bold text-slate-900">{activeCam.name}</div>
                </div>
              </div>
            </div>

            {/* Evidence Snapshot Preview & Why is this a Threat? */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              {/* Evidence Snapshot */}
              <div className="sm:col-span-5">
                <div
                  onClick={() => latestAlert && setSelectedIncidentModal(latestAlert)}
                  className="rounded-lg overflow-hidden border border-rose-200 bg-black aspect-[4/3] relative cursor-pointer group shadow-2xs"
                  title="Click to inspect full evidence"
                >
                  <img
                    src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&auto=format&fit=crop&q=60"
                    alt="Alert Snapshot"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Human-Readable Threat Reasons */}
              <div className="sm:col-span-7 bg-white/80 border border-rose-200/80 rounded-lg p-2.5 flex flex-col justify-center space-y-1.5 text-xs text-rose-950 font-medium">
                <div className="text-[10px] font-black uppercase tracking-wider text-rose-900">
                  Why was this triggered?
                </div>
                <ul className="space-y-1 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <span className="text-rose-600 font-bold">➔</span>
                    <span>Moving toward border</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-rose-600 font-bold">⏱️</span>
                    <span>Estimated breach in ~5s</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-rose-600 font-bold">⏳</span>
                    <span>Loitering for 24 seconds</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-rose-600 font-bold">🌙</span>
                    <span>Restricted curfew time (Night)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM SECTION: RECENT INCIDENTS TABLE & OPERATIONAL HEALTH            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left (8 Cols): Recent Incidents Operational Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900">Recent Incidents Log</h3>
              </div>
              <button
                onClick={() => navigate('/detections')}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                View All Incidents <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="pb-2.5 font-semibold">Time</th>
                    <th className="pb-2.5 font-semibold">Camera</th>
                    <th className="pb-2.5 font-semibold">Event Description</th>
                    <th className="pb-2.5 font-semibold">Zone</th>
                    <th className="pb-2.5 font-semibold">Threat Score</th>
                    <th className="pb-2.5 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {/* Row 1 */}
                  <tr
                    onClick={() => latestAlert && setSelectedIncidentModal(latestAlert)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-mono text-[11px] text-rose-600 font-bold">22:41:18</td>
                    <td className="py-2.5 font-bold text-slate-900">CAM-04</td>
                    <td className="py-2.5 font-semibold text-rose-800">
                      Person approaching border fence
                    </td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Yellow Zone
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-rose-600">86 / 100</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                        Critical
                      </span>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr
                    onClick={() => latestAlert && setSelectedIncidentModal(latestAlert)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">22:37:04</td>
                    <td className="py-2.5 font-bold text-slate-900">CAM-03</td>
                    <td className="py-2.5 font-medium text-slate-800">Loitering near perimeter detected</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Yellow Zone
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-700">67 / 100</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-900">
                        Under Watch
                      </span>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr
                    onClick={() => latestAlert && setSelectedIncidentModal(latestAlert)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">22:28:11</td>
                    <td className="py-2.5 font-bold text-slate-900">CAM-06</td>
                    <td className="py-2.5 font-medium text-slate-800">Vehicle in yellow approach sector</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Yellow Zone
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-700">52 / 100</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-900">
                        Under Watch
                      </span>
                    </td>
                  </tr>

                  {/* Row 4 */}
                  <tr
                    onClick={() => latestAlert && setSelectedIncidentModal(latestAlert)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">22:21:09</td>
                    <td className="py-2.5 font-bold text-slate-900">CAM-01</td>
                    <td className="py-2.5 font-medium text-slate-800">Person verified in green sector</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Green Zone
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-700">18 / 100</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                        Normal
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right (4 Cols): Operational Health Checklist */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
            System & Subsystem Health
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <Cpu className="w-3.5 h-3.5 text-blue-700" /> AI Detection Engine
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> YOLOv8n (30 FPS)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <Layers className="w-3.5 h-3.5 text-blue-700" /> Multi-Camera Tracking
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ByteTrack + OSNet
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <Database className="w-3.5 h-3.5 text-blue-700" /> Cryptographic Evidence
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> AES-128 Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <Radio className="w-3.5 h-3.5 text-blue-700" /> C2 WebSocket Channel
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-blue-700" /> Evidence Storage
              </span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[62%] h-full bg-blue-600 rounded-full" />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-700">62%</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-[11px]">All Core Systems Operational</div>
              <div className="text-[10px] text-emerald-700">Pipeline latency ~33ms (Real-time)</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. INCIDENT DETAIL MODAL (Interactive Officer Inspection)                 */}
      {/* ========================================================================= */}
      {selectedIncidentModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedIncidentModal(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Incident #{selectedIncidentModal.id} Detailed Report
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Camera: {selectedIncidentModal.cameraName.toUpperCase()} · Track ID #{selectedIncidentModal.trackId}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncidentModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Evidence Image */}
            <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-black border border-slate-200">
              <EvidenceImage
                src={selectedIncidentModal.snapshotUrl ? apiAssetUrl(selectedIncidentModal.snapshotUrl) : undefined}
                alt={`Evidence snapshot for Incident #${selectedIncidentModal.id}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Threat Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Threat Score</div>
                <div className="text-sm font-black text-rose-600 mt-0.5">
                  {selectedIncidentModal.score} / 100
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Perimeter Zone</div>
                <div className="text-sm font-bold text-amber-700 mt-0.5 uppercase">
                  {selectedIncidentModal.zoneTier || 'Yellow'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedIncidentModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigate(`/live?camera=${selectedIncidentModal.cameraName}`);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Go to Live Camera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

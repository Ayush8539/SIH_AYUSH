import React, { useState, useEffect } from 'react';
import { Menu, Volume2, VolumeX, Shield, Bell, BellOff } from 'lucide-react';
import { useAlerts } from '@/components/alerts/AlertProvider';
import { useSystemHealth } from '@/components/system/SystemHealthProvider';

interface TopbarProps {
  onOpenMobileSidebar: () => void;
  systemStatus?: 'online' | 'air-gapped' | 'standby';
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileSidebar }) => {
  const { soundEnabled, toggleSound, popupsMuted, toggleMutePopups } = useAlerts();
  const { cameras, reachable } = useSystemHealth();
  const [currentTime, setCurrentTime] = useState({ time: '', date: '' });

  const onlineCams = cameras.filter((c) => c.health === 'online').length;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime({
        time: now.toLocaleTimeString('en-GB', { hour12: false }),
        date: now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-18 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs select-none">
      {/* Left: Brand / Logo & Center Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black shadow-sm ring-2 ring-blue-600/20">
            <Shield className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-900 font-sans">
                IBVAP
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 border-l border-slate-200 pl-2">
                Border Surveillance Command Center
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Secure Borders · National Threat Monitoring Console
            </div>
          </div>
        </div>
      </div>

      {/* Right: Quick Controls, System Status, Clock & Operator Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Audio / Toast Controls */}
        <div className="hidden sm:flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
            className={`p-1.5 rounded-md transition-colors ${
              soundEnabled
                ? 'text-blue-700 bg-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={toggleMutePopups}
            title={popupsMuted ? 'Unmute Toast Popups' : 'Mute Toast Popups'}
            className={`p-1.5 rounded-md transition-colors ${
              !popupsMuted
                ? 'text-blue-700 bg-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {popupsMuted ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* System Online Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            reachable !== false
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span
            className={`inline-flex rounded-full h-2 w-2 ${
              reachable !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="font-semibold">
            {reachable !== false ? `System Online (${onlineCams}/${cameras.length || 2})` : 'Backend Disconnected'}
          </span>
        </div>

        {/* Live Date / Time Clock */}
        <div className="hidden md:flex flex-col text-right pl-1">
          <div className="font-mono font-bold text-slate-900 text-xs tracking-tight">
            {currentTime.time || '--:--:--'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {currentTime.date || '---'}
          </div>
        </div>

        {/* Operator Profile */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            OP
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">Duty Officer</div>
            <div className="text-[10px] text-slate-500 font-medium">Control Room Alpha</div>
          </div>
        </div>
      </div>
    </header>
  );
};

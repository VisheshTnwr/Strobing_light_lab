import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

export function StrobeVisualizer({ intensity, frequency }) {
  const [isOnPhase, setIsOnPhase] = useState(true);

  useEffect(() => {
    if (frequency <= 0 || intensity <= 0) {
      setIsOnPhase(true);
      return;
    }

    const halfPeriodMs = 1000 / (frequency * 2);
    const timer = setInterval(() => {
      setIsOnPhase((prev) => !prev);
    }, halfPeriodMs);

    return () => clearInterval(timer);
  }, [frequency, intensity]);

  const activeIntensity = (isOnPhase && intensity > 0) ? intensity : 0;
  const brightnessPercentage = Math.round((activeIntensity / 255) * 100);
  const glowRadius = Math.round((activeIntensity / 255) * 35);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px', minHeight: '220px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', width: '100%' }}>
        <Eye size={16} color="var(--accent-cyan)" />
        <span style={{ fontWeight: '700', fontSize: '0.88rem', fontFamily: 'var(--font-heading)' }}>
          Live Light Output Visualizer
        </span>
      </div>

      {/* Simulated Clean 10W COB LED Panel */}
      <div
        style={{
          width: '110px',
          height: '110px',
          borderRadius: '16px',
          background: activeIntensity > 0
            ? `radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(253, 224, 71, ${activeIntensity / 255}) 50%, rgba(245, 158, 11, ${activeIntensity / 255}) 100%)`
            : '#07090e',
          border: `1px solid ${activeIntensity > 0 ? '#fde047' : '#1e293b'}`,
          boxShadow: activeIntensity > 0
            ? `0 0 ${glowRadius}px ${glowRadius / 2}px rgba(253, 224, 71, ${activeIntensity / 255})`
            : 'none',
          transition: frequency > 15 ? 'none' : 'all 0.05s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{
          fontSize: '0.72rem',
          fontWeight: '700',
          color: activeIntensity > 128 ? '#0f172a' : '#94a3b8',
          background: activeIntensity > 128 ? 'rgba(255,255,255,0.85)' : 'rgba(7, 9, 14, 0.85)',
          padding: '3px 10px',
          borderRadius: '6px',
          fontFamily: 'var(--font-mono)'
        }}>
          {frequency === 0 ? 'SOLID' : `${frequency} Hz`}
        </span>
      </div>

      <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '14px' }}>
        <div>Brightness: <strong style={{ color: 'var(--accent-amber)' }}>{brightnessPercentage}%</strong></div>
        <div>Mode: <strong style={{ color: 'var(--accent-cyan)' }}>{frequency === 0 ? 'Solid DC' : `${frequency} Hz Strobe`}</strong></div>
      </div>
    </div>
  );
}

import React from 'react';
import { Sliders, Zap, Sun, ShieldAlert } from 'lucide-react';

export function PresetGrid({ onSelectPreset }) {
  const presets = [
    {
      name: '🛑 Emergency Off',
      intensity: 0,
      frequency: 0,
      desc: 'Turn off light immediately (0, 0)',
      color: 'var(--accent-red)',
      icon: ShieldAlert,
    },
    {
      name: '💡 Solid Light (100%)',
      intensity: 255,
      frequency: 0,
      desc: 'Continuous DC light output (255, 0)',
      color: 'var(--accent-amber)',
      icon: Sun,
    },
    {
      name: '🧠 40 Hz Gamma Strobe',
      intensity: 255,
      frequency: 40,
      desc: '40Hz Gamma entrainment protocol (255, 40)',
      color: 'var(--accent-cyan)',
      icon: Zap,
    },
    {
      name: '⚡ 10 Hz Alpha Strobe',
      intensity: 255,
      frequency: 10,
      desc: '10Hz Alpha frequency pulse (255, 10)',
      color: 'var(--accent-purple)',
      icon: Zap,
    },
    {
      name: '⚡ 20 Hz Beta Strobe',
      intensity: 255,
      frequency: 20,
      desc: '20Hz Beta frequency pulse (255, 20)',
      color: 'var(--accent-green)',
      icon: Zap,
    },
    {
      name: '⚡ 60 Hz High Strobe',
      intensity: 255,
      frequency: 60,
      desc: '60Hz high frequency flicker test (255, 60)',
      color: '#ec4899',
      icon: Zap,
    },
  ];

  return (
    <div className="card">
      <h2 className="card-title">
        <Sliders size={20} color="var(--accent-purple)" />
        Quick Experiment Presets
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {presets.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              className="btn btn-preset"
              onClick={() => onSelectPreset(p.intensity, p.frequency)}
              style={{ alignItems: 'flex-start', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: p.color, fontWeight: '700' }}>
                <Icon size={16} />
                {p.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {p.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

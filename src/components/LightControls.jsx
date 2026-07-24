import React from 'react';
import { Sun, Radio, RotateCcw } from 'lucide-react';

export function LightControls({
  intensity,
  setIntensity,
  frequency,
  setFrequency,
  onReset,
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      <h2 className="card-title" style={{ margin: 0, fontSize: '1.2rem' }}>
        <Sun size={22} color="var(--accent-amber)" />
        Light Controls
      </h2>

      {/* Brightness / Intensity Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
          <label style={{ fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={18} color="var(--accent-amber)" />
            Brightness:
          </label>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-amber)', fontSize: '1.1rem' }}>
            {Math.round((intensity / 255) * 100)}% <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({intensity}/255)</span>
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="255"
          step="1"
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          style={{ height: '10px' }}
        />

        {/* Quick Intensity Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {[
            { label: 'OFF', val: 0 },
            { label: '25%', val: 64 },
            { label: '50%', val: 128 },
            { label: '75%', val: 192 },
            { label: '100%', val: 255 },
          ].map((item) => (
            <button
              key={item.val}
              className={`btn ${intensity === item.val ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
              onClick={() => setIntensity(item.val)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strobe Frequency Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
          <label style={{ fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} color="var(--accent-cyan)" />
            Strobe Speed (Frequency):
          </label>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>
            {frequency === 0 ? 'Solid Light (0 Hz)' : `${frequency} Hz`}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={frequency}
          onChange={(e) => setFrequency(Number(e.target.value))}
          style={{ height: '10px' }}
        />

        {/* Quick Frequency Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {[
            { label: 'Solid', val: 0 },
            { label: '5 Hz', val: 5 },
            { label: '10 Hz', val: 10 },
            { label: '20 Hz', val: 20 },
            { label: '40 Hz', val: 40 },
          ].map((item) => (
            <button
              key={item.val}
              className={`btn ${frequency === item.val ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
              onClick={() => setFrequency(item.val)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button className="btn btn-secondary" onClick={onReset} style={{ padding: '10px', fontSize: '0.85rem', marginTop: '4px' }}>
        <RotateCcw size={16} />
        Reset Light Controls
      </button>
    </div>
  );
}

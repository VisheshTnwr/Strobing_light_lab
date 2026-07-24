import React from 'react';
import { X, Wrench, AlertTriangle, Cpu, Usb, CheckCircle2 } from 'lucide-react';

export function TroubleshootingModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div className="card" style={{
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        border: '1px solid var(--accent-cyan)',
        boxShadow: '0 10px 40px rgba(6, 182, 212, 0.2)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={24} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
              Hardware & Serial Port Troubleshooting Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Diagnostic Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Issue 1 */}
          <div style={{ background: '#111827', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', fontWeight: '600', marginBottom: '6px' }}>
              <AlertTriangle size={18} />
              1. Arduino Upload Error: "Wrong boot mode detected (0x13)"
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <strong>Solution:</strong> When uploading firmware via Arduino IDE, hold down the physical <strong>BOOT / IO0 button</strong> on the ESP32 board right when the terminal displays <code>Connecting........</code>. Release it once flashing starts.
            </p>
          </div>

          {/* Issue 2 */}
          <div style={{ background: '#111827', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', fontWeight: '600', marginBottom: '6px' }}>
              <Usb size={18} />
              2. "Port Busy" or "Failed to open serial port"
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <strong>Solution:</strong> Only 1 application can access a COM port at a time. Close the <strong>Arduino IDE Serial Monitor</strong> or any terminal apps accessing the same COM port before clicking Connect in this Electron app.
            </p>
          </div>

          {/* Issue 3 */}
          <div style={{ background: '#111827', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: '600', marginBottom: '6px' }}>
              <Cpu size={18} />
              3. Serial Log Shows Unreadable / Garbage Characters
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <strong>Solution:</strong> Ensure your app's Baud Rate is set to <strong>115200</strong>, which matches <code>Serial.begin(115200);</code> in the ESP32 <code>sketch_jul22a.ino</code> firmware.
            </p>
          </div>

          {/* Issue 4 */}
          <div style={{ background: '#111827', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', fontWeight: '600', marginBottom: '6px' }}>
              <CheckCircle2 size={18} />
              4. Hardware Wiring Verification Checklist
            </div>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><strong>MOSFET Gate:</strong> Connected to ESP32 <strong>GPIO Pin 23</strong>.</li>
              <li><strong>Common Ground (GND):</strong> Ensure ESP32 GND and the 12V Power Supply GND are connected together.</li>
              <li><strong>LED COB Load:</strong> 12V LED connected between +12V power supply and MOSFET Drain. MOSFET Source to GND.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Got it, return to controller
          </button>
        </div>
      </div>
    </div>
  );
}

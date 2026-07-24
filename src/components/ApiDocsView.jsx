import React from 'react';
import { BookOpen, Cpu, Terminal, ShieldCheck, Zap, Layers, HelpCircle } from 'lucide-react';

export function ApiDocsView({ onOpenTroubleshooting }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      {/* Overview Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>
            <BookOpen size={20} color="var(--accent-cyan)" />
            Developer UART Serial Protocol & Command Reference
          </h2>
          <button className="btn btn-secondary" onClick={onOpenTroubleshooting}>
            <HelpCircle size={16} />
            Hardware Debug Guide
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          The Strobing Light System communicates via standard USB Serial UART at <strong>115200 Baud</strong>.
          Commands are ASCII text strings containing comma-separated parameters terminated with a Line Feed (<code>\n</code>) character.
        </p>
      </div>

      {/* Protocol Specs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Command Syntax Table */}
        <div className="card">
          <h3 className="card-title">
            <Terminal size={18} color="var(--accent-green)" />
            Command Syntax Format
          </h3>

          <div style={{
            background: '#070b14',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            <div style={{ color: 'var(--accent-cyan)' }}>Format: &lt;INTENSITY&gt;,&lt;FREQUENCY&gt;\n</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
              Example: 255,40.0\n (Full Brightness, 40Hz Gamma Strobe)
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '8px' }}>Parameter</th>
                <th style={{ padding: '8px' }}>Range / Data Type</th>
                <th style={{ padding: '8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>INTENSITY</td>
                <td style={{ padding: '8px' }}>Integer (0 - 255)</td>
                <td style={{ padding: '8px' }}>8-bit PWM Duty Cycle (0 = Off, 255 = 100%)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>FREQUENCY</td>
                <td style={{ padding: '8px' }}>Float (0.0 - 100.0)</td>
                <td style={{ padding: '8px' }}>Strobe frequency in Hz (0 = Solid Light)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Expected Firmware Acknowledgments */}
        <div className="card">
          <h3 className="card-title">
            <ShieldCheck size={18} color="var(--accent-purple)" />
            Firmware Acknowledgments (ACK Responses)
          </h3>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Upon parsing a valid string command, the ESP32 responds immediately over serial with an ACK line:
          </p>

          <div style={{
            background: '#070b14',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            color: 'var(--accent-green)',
            lineHeight: '1.6'
          }}>
            <div>ACK: Intensity set to 255, Frequency set to 40.00</div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            <strong>Boot Message:</strong> On initial power up or reset, ESP32 transmits:
            <code style={{ display: 'block', color: 'var(--accent-amber)', marginTop: '4px' }}>
              System Ready. Awaiting commands (Format: Intensity,Frequency)
            </code>
          </div>
        </div>
      </div>

      {/* Hardware Connections Card */}
      <div className="card">
        <h3 className="card-title">
          <Cpu size={18} color="var(--accent-cyan)" />
          Hardware & Schematic Topology
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          fontSize: '0.82rem'
        }}>
          <div style={{ background: '#111827', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--accent-cyan)' }}>1. ESP32 Microcontroller</strong>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Generates 5 kHz hardware PWM carrier via LEDC Channel 0 on <strong>GPIO 23</strong>.
            </p>
          </div>

          <div style={{ background: '#111827', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--accent-green)' }}>2. IRLZ44N N-Channel MOSFET</strong>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Logic-level Gate driver switched by GPIO 23 with 10k pull-down resistor.
            </p>
          </div>

          <div style={{ background: '#111827', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--accent-amber)' }}>3. 10W COB LED Panel</strong>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Powered by 12V 2A external DC power source, switched at high frequency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

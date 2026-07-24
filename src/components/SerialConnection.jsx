import React from 'react';
import { Usb, Power, AlertCircle, Info } from 'lucide-react';

export function SerialConnection({
  isConnected,
  onConnect,
  onDisconnect,
  baudRate,
  setBaudRate,
  errorMsg,
  txCount,
  rxCount,
}) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
            <Usb size={20} />
            <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Serial USB Port</span>
          </div>

          {/* Baud Rate Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Baud Rate:</label>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={isConnected}
              style={{
                background: '#1e293b',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              <option value={9600}>9600</option>
              <option value={19200}>19200</option>
              <option value={57600}>57600</option>
              <option value={115200}>115200 (Default ESP32)</option>
              <option value={230400}>230400</option>
              <option value={921600}>921600</option>
            </select>
          </div>
        </div>

        {/* Connect / Disconnect Button & Statistics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>TX Packets: <strong style={{ color: 'var(--accent-cyan)' }}>{txCount}</strong></span>
            <span>RX Packets: <strong style={{ color: 'var(--accent-green)' }}>{rxCount}</strong></span>
          </div>

          {!isConnected ? (
            <button className="btn btn-primary" onClick={() => onConnect(baudRate)}>
              <Power size={18} />
              Connect ESP32 Port
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={onDisconnect} style={{ color: 'var(--accent-red)' }}>
              <Power size={18} />
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Tip helper */}
      {!isConnected && (
        <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={14} color="var(--accent-cyan)" />
          <span>Tip: Close the Arduino IDE Serial Monitor window before connecting so COM9 port is released.</span>
        </div>
      )}

      {/* Error alert banner */}
      {errorMsg && (
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: 'var(--accent-red)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}

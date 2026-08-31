import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Activity,
  Cpu,
  Zap,
  RotateCcw,
  Download,
  Copy,
  Trash2,
  Play,
  Pause,
  Send,
  Plus,
  Bookmark,
  CheckCircle,
  AlertCircle,
  Code,
  Sliders,
  Radio,
  FileCode,
  Search,
  Gauge,
  Lock,
} from 'lucide-react';

export function DevDashboard({
  isConnected = false,
  onConnect = () => {},
  onDisconnect = () => {},
  baudRate = 115200,
  setBaudRate = () => {},
  lineEnding = '\n',
  setLineEnding = () => {},
  errorMsg = null,
  logs = [],
  clearLogs = () => {},
  exportLogs = () => {},
  onSendRawCommand = () => {},
  txCount = 0,
  rxCount = 0,
  txBytes = 0,
  rxBytes = 0,
  ackCount = 0,
  lastLatencyMs = null,
  lastAck = null,
  lastAckTime = null,
  portInfo = {},
  resetMetrics = () => {},
  currentIntensity = 0,
  currentFrequency = 0,
  onSelectPreset = () => {},
  onLockDev = () => {},
}) {
  const [activeSubTab, setActiveSubTab] = useState('console'); // 'console', 'macros', 'pwm', 'firmware'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [inputText, setInputText] = useState('');

  // Custom Macro state stored in localStorage
  const [customMacros, setCustomMacros] = useState(() => {
    try {
      const saved = localStorage.getItem('esp32_dev_macros');
      return saved ? JSON.parse(saved) : [
        { name: '40Hz Gamma Stimulus', cmd: '255,40', desc: 'Full brightness 40Hz strobe' },
        { name: '10Hz Alpha Mode', cmd: '192,10', desc: '75% brightness 10Hz strobe' },
        { name: 'Solid Max Beam', cmd: '255,0', desc: '100% duty solid light' },
        { name: 'Low Power 1Hz', cmd: '32,1', desc: 'Minimal pulse 1Hz' },
        { name: 'System Cutoff', cmd: '0,0', desc: 'Immediate 0% output' },
      ];
    } catch (e) {
      return [];
    }
  });

  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroCmd, setNewMacroCmd] = useState('');
  const [newMacroDesc, setNewMacroDesc] = useState('');

  const logRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Save macros
  const saveMacros = (updated) => {
    setCustomMacros(updated);
    try {
      localStorage.setItem('esp32_dev_macros', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save macros:', e);
    }
  };

  const handleAddMacro = (e) => {
    e.preventDefault();
    if (!newMacroName.trim() || !newMacroCmd.trim()) return;
    const updated = [
      ...customMacros,
      { name: newMacroName.trim(), cmd: newMacroCmd.trim(), desc: newMacroDesc.trim() || 'Custom Dev Macro' }
    ];
    saveMacros(updated);
    setNewMacroName('');
    setNewMacroCmd('');
    setNewMacroDesc('');
  };

  const handleDeleteMacro = (index) => {
    const updated = customMacros.filter((_, i) => i !== index);
    saveMacros(updated);
  };

  const handleSendSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    onSendRawCommand(inputText.trim());
    setInputText('');
  };

  // Safe Log filtering
  const safeLogs = Array.isArray(logs) ? logs : [];
  const filteredLogs = safeLogs.filter((log) => {
    if (!log) return false;
    const matchesFilter = filterType === 'ALL' ? true : log.type === filterType;
    const matchesSearch = searchTerm === '' ? true :
      (log.message && log.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.type && log.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.time && log.time.includes(searchTerm));
    return matchesFilter && matchesSearch;
  });

  // Calculate PWM Timing Parameters
  const periodMs = currentFrequency > 0 ? (1000 / currentFrequency).toFixed(2) : '∞ (DC)';
  const onTimeMs = currentFrequency > 0 ? (1000 / (currentFrequency * 2)).toFixed(2) : (currentIntensity > 0 ? 'Continuous' : '0');
  const dutyCyclePct = ((currentIntensity / 255) * 100).toFixed(1);
  const ackSuccessRate = txCount > 0 ? Math.min(100, Math.round((ackCount / txCount) * 100)) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, color: 'var(--text-primary)' }}>
      {/* Dev Hardware Connection Toolbar */}
      <div className="card" style={{ padding: '14px 18px', background: '#0b1120', border: '1px solid var(--border-highlight)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={18} />
              ESP32 Serial Port Config:
            </span>

            {/* Baud Rate Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Baud Speed:</span>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(Number(e.target.value))}
                disabled={isConnected}
                style={{
                  background: '#1e293b',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!isConnected ? (
              <button className="btn btn-primary" onClick={() => onConnect(baudRate)} style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                <Zap size={14} />
                Connect Serial Port
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={onDisconnect} style={{ padding: '6px 14px', fontSize: '0.82rem', color: 'var(--accent-red)' }}>
                Disconnect Port
              </button>
            )}
          </div>
        </div>

        {/* Error Diagnostic Alert Banner */}
        {errorMsg && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>

            <button
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              onClick={() => onConnect(baudRate)}
            >
              Retry Connect
            </button>
          </div>
        )}
      </div>

      {/* Dev Header & Telemetry Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px'
      }}>
        {/* Metric 1: Serial State */}
        <div className="card" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isConnected ? 'var(--accent-green)' : 'var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Port Status & Speed
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: isConnected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {isConnected ? `@ ${baudRate} Baud` : 'Disconnected'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              VID/PID: {portInfo?.usbVendorId || 'N/A'} / {portInfo?.usbProductId || 'N/A'}
            </div>
          </div>
        </div>

        {/* Metric 2: Packets & Bytes */}
        <div className="card" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.15)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(6, 182, 212, 0.3)'
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Traffic Throughput
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-mono)' }}>
              TX: {txCount} pkts ({txBytes} B)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
              RX: {rxCount} pkts ({rxBytes} B)
            </div>
          </div>
        </div>

        {/* Metric 3: ACK Rate & Response Latency */}
        <div className="card" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <Gauge size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ACK Integrity & Latency
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
              ACK Success: {ackSuccessRate}% ({ackCount})
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Latency: {lastLatencyMs !== null ? `${lastLatencyMs} ms` : 'Waiting packet...'}
            </div>
          </div>
        </div>

        {/* Metric 4: PWM Driver Telemetry */}
        <div className="card" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.15)',
            color: 'var(--accent-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hardware Duty / Target
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>
              {dutyCyclePct}% Duty ({currentIntensity}/255)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {currentFrequency > 0 ? `${currentFrequency} Hz Strobe` : 'Solid DC Mode'}
            </div>
          </div>
        </div>
      </div>

      {/* Dev Sub-Tab Navigation Switcher & Lock Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        background: '#111827',
        padding: '8px 12px',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeSubTab === 'console' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setActiveSubTab('console')}
          >
            <Terminal size={15} />
            Diagnostic Serial Console ({filteredLogs.length})
          </button>

          <button
            className={`btn ${activeSubTab === 'macros' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setActiveSubTab('macros')}
          >
            <Bookmark size={15} />
            Command Macros ({customMacros.length})
          </button>

          <button
            className={`btn ${activeSubTab === 'pwm' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setActiveSubTab('pwm')}
          >
            <Sliders size={15} />
            PWM & Timing Diagnostics
          </button>

          <button
            className={`btn ${activeSubTab === 'firmware' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setActiveSubTab('firmware')}
          >
            <Code size={15} />
            ESP32 Firmware Code Viewer
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}
            onClick={resetMetrics}
            title="Reset TX/RX metrics counters"
          >
            <RotateCcw size={14} />
            Reset Metrics
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--accent-amber)', borderColor: 'rgba(245,158,11,0.4)' }}
            onClick={onLockDev}
            title="Lock Dev Tab and return to User Dashboard"
          >
            <Lock size={14} />
            Lock Dev Tab
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DIAGNOSTIC SERIAL CONSOLE */}
      {activeSubTab === 'console' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '420px' }}>
          {/* Console Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter logs by keyword, type or timestamp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '6px 10px 6px 30px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  background: '#1e293b',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                }}
              >
                <option value="ALL">All Types ({safeLogs.length})</option>
                <option value="TX">TX Sent</option>
                <option value="RX">RX Received</option>
                <option value="ERR">Errors</option>
                <option value="SYS">System</option>
              </select>

              {/* Line Delimiter */}
              <select
                value={lineEnding}
                onChange={(e) => setLineEnding(e.target.value)}
                style={{
                  background: '#1e293b',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                }}
              >
                <option value="\n">Delimiter: LF (\n)</option>
                <option value="\r\n">Delimiter: CRLF (\r\n)</option>
                <option value="">Delimiter: None</option>
              </select>

              {/* Auto Scroll Toggle */}
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={() => setAutoScroll(!autoScroll)}
              >
                {autoScroll ? <Pause size={14} /> : <Play size={14} />}
                {autoScroll ? 'Pause' : 'Scroll'}
              </button>

              {/* Export Buttons */}
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={() => exportLogs('txt')}
                title="Export logs as .txt file"
              >
                <Download size={14} />
                Export TXT
              </button>

              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={() => exportLogs('json')}
                title="Export logs as JSON file"
              >
                <FileCode size={14} />
                Export JSON
              </button>

              {/* Clear */}
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-red)' }}
                onClick={clearLogs}
              >
                <Trash2 size={14} />
                Clear
              </button>
            </div>
          </div>

          {/* Terminal Console View */}
          <div
            ref={logRef}
            style={{
              flex: 1,
              background: '#070b14',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minHeight: '280px',
              maxHeight: '440px',
            }}
          >
            {filteredLogs.length === 0 ? (
              <div style={{ color: '#4b5563', fontStyle: 'italic', textAlign: 'center', marginTop: '60px' }}>
                No serial events matching criteria. Connect serial port or adjust filter query.
              </div>
            ) : (
              filteredLogs.map((log) => {
                let typeColor = '#9ca3af';
                let bg = 'transparent';

                if (log.type === 'TX') {
                  typeColor = 'var(--accent-cyan)';
                } else if (log.type === 'RX') {
                  typeColor = 'var(--accent-green)';
                  if (log.message && log.message.includes('ACK')) bg = 'rgba(16, 185, 129, 0.08)';
                } else if (log.type === 'ERR') {
                  typeColor = 'var(--accent-red)';
                  bg = 'rgba(239, 68, 68, 0.12)';
                } else if (log.type === 'SYS') {
                  typeColor = 'var(--accent-amber)';
                }

                return (
                  <div
                    key={log.id || Math.random()}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      background: bg,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      lineHeight: '1.4',
                    }}
                  >
                    <span style={{ color: '#4b5563', userSelect: 'none' }}>[{log.time || '00:00'}]</span>
                    <span style={{ color: typeColor, fontWeight: '700', minWidth: '45px', userSelect: 'none' }}>
                      [{log.type || 'LOG'}]
                    </span>
                    <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{log.message || ''}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Raw Input Bar */}
          <form onSubmit={handleSendSubmit} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isConnected ? 'Send raw string (e.g. 255,40 or 0,0)...' : 'Connect Serial Port first to transmit commands'}
              disabled={!isConnected}
              style={{
                flex: 1,
                background: '#111827',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />

            <button type="submit" className="btn btn-primary" disabled={!isConnected || !inputText.trim()}>
              <Send size={16} />
              Transmit
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={!isConnected}
              onClick={() => onSendRawCommand('0,0')}
              title="Send 0,0 ping to test connection"
            >
              Ping 0,0
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: COMMAND MACROS & DEVELOPER PAYLOAD MANAGER */}
      {activeSubTab === 'macros' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(280px, 1fr)', gap: '16px' }}>
          {/* Saved Custom Macros */}
          <div className="card">
            <h3 className="card-title">
              <Bookmark size={18} color="var(--accent-cyan)" />
              Saved Developer Command Library
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Click any macro button below to send its formatted UART command payload directly to the ESP32.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {customMacros.map((macro, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#111827',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{macro.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{macro.desc}</div>
                    <code style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      Payload: "{macro.cmd}\n"
                    </code>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      disabled={!isConnected}
                      onClick={() => onSendRawCommand(macro.cmd)}
                    >
                      <Send size={14} />
                      Send
                    </button>

                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px', color: 'var(--accent-red)' }}
                      onClick={() => handleDeleteMacro(idx)}
                      title="Delete Macro"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create New Custom Macro Form */}
          <div className="card">
            <h3 className="card-title">
              <Plus size={18} color="var(--accent-green)" />
              Add Custom Command Macro
            </h3>
            <form onSubmit={handleAddMacro} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Macro Label / Name:</label>
                <input
                  type="text"
                  placeholder="e.g. 60Hz High-Speed Test"
                  value={newMacroName}
                  onChange={(e) => setNewMacroName(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#111827',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    marginTop: '4px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Raw Payload Command (INTENSITY,FREQ):</label>
                <input
                  type="text"
                  placeholder="e.g. 255,60"
                  value={newMacroCmd}
                  onChange={(e) => setNewMacroCmd(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#111827',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    marginTop: '4px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description / Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. Test 60Hz pulse response on LED"
                  value={newMacroDesc}
                  onChange={(e) => setNewMacroDesc(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#111827',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    marginTop: '4px'
                  }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                <Plus size={16} />
                Save New Macro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PWM & TIMING DIAGNOSTICS */}
      {activeSubTab === 'pwm' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* PWM Parameter Calculations */}
          <div className="card">
            <h3 className="card-title">
              <Sliders size={18} color="var(--accent-amber)" />
              Real-Time PWM Timing Calculator
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#111827', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Strobe Frequency:</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {currentFrequency} Hz
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#111827', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Strobe Cycle Period (T):</span>
                <span style={{ fontWeight: '700', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {periodMs} ms
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#111827', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ON Phase Duration (T_on):</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                  {onTimeMs} ms
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#111827', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>PWM Carrier Frequency (LEDC):</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                  5000 Hz (Flicker-Free)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#111827', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>LEDC PWM Resolution:</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>
                  8-bit (0 - 255 Duty Steps)
                </span>
              </div>
            </div>
          </div>

          {/* Pin Assignment & Hardware Diagram */}
          <div className="card">
            <h3 className="card-title">
              <Cpu size={18} color="var(--accent-purple)" />
              ESP32 Pinout Assignment & Circuit Map
            </h3>
            <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '12px', background: '#111827', padding: '10px', borderRadius: '6px' }}>
                <strong style={{ color: '#fff' }}>MOSFET Gate Output: Pin GPIO 23</strong>
                <div>Connected to IRLZ44N Gate via 220Ω resistor + 10kΩ pull-down.</div>
              </div>

              <div style={{ borderLeft: '3px solid var(--accent-green)', paddingLeft: '12px', background: '#111827', padding: '10px', borderRadius: '6px' }}>
                <strong style={{ color: '#fff' }}>Serial UART Interface: GPIO 3 (RX) / GPIO 1 (TX)</strong>
                <div>Hardware USB CDC Serial @ 115200 Baud.</div>
              </div>

              <div style={{ borderLeft: '3px solid var(--accent-amber)', paddingLeft: '12px', background: '#111827', padding: '10px', borderRadius: '6px' }}>
                <strong style={{ color: '#fff' }}>Power Supply: 12V 2A DC Adapter</strong>
                <div>Powers the 10W COB LED panel through the MOSFET Drain-Source channel.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ESP32 ARDUINO FIRMWARE CODE VIEWER */}
      {activeSubTab === 'firmware' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              <Code size={18} color="var(--accent-cyan)" />
              ESP32 Arduino Firmware Source Code (sketch_jul22a.ino)
            </h3>

            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => {
                const code = `/*
 * ============================================================================
 * Subject Stimulus Controller Firmware
 * Project: Strobing Light System
 * Hardware: ESP32 + IRLZ44N MOSFET + 12V 10W COB LED Panel + 12V-to-5V Buck
 * Signal Path:
 *   - Mode 1: USB Serial @ 115200 Baud (React / Electron / Desktop Chrome)
 *   - Mode 2: Standalone Wi-Fi AP @ 192.168.4.1 (Android / Mobile Web / iOS)
 * ============================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Ticker.h>

// --- Wi-Fi Access Point Configuration ---
const char* ap_ssid = "StrobeLight_AP";
const char* ap_password = "strobe1234"; // Minimum 8 characters. Set to "" for open Wi-Fi

// --- Web Server on Port 80 ---
WebServer server(80);

// --- Hardware Pins & LEDC PWM Settings ---
const int mosfetPin = 23;            // ESP32 GPIO 23 connected to MOSFET Gate
const int pwmChannel = 0;            // LEDC PWM channel (for ESP32 Core v2.x)
const int pwmCarrierFreq = 5000;     // 5000 Hz carrier frequency for flicker-free dimming
const int pwmRes = 8;                // 8-bit resolution (0-255 brightness duty cycle)

// --- Dynamic Control State ---
volatile int currentIntensity = 0;   // 0 (OFF) to 255 (Max Brightness)
volatile float currentFrequency = 0; // 0 = Solid ON / OFF, >0 = Strobing frequency in Hz
volatile bool isLedHighPhase = false;

// --- Hardware Timer for Jitter-Free Strobing ---
Ticker strobeTicker;

// --- Helper function for ESP32 Arduino Core v2.x vs v3.x compatibility ---
inline void writePwm(int duty) {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(mosfetPin, duty);
#else
  ledcWrite(pwmChannel, duty);
#endif
}

// --- ISR Timer Callback: Toggles LED output on/off at precise intervals ---
void IRAM_ATTR onStrobeTimer() {
  isLedHighPhase = !isLedHighPhase;
  int targetDuty = isLedHighPhase ? currentIntensity : 0;
  writePwm(targetDuty);
}

// --- Updates the Hardware Timer and PWM State ---
void updateStrobeState() {
  strobeTicker.detach();

  if (currentIntensity <= 0 || currentFrequency <= 0) {
    isLedHighPhase = true;
    writePwm(currentIntensity);
  } else {
    float halfPeriodSec = 1.0f / (currentFrequency * 2.0f);
    isLedHighPhase = true;
    writePwm(currentIntensity);
    strobeTicker.attach(halfPeriodSec, onStrobeTimer);
  }
}

// --- Process Raw Command String ("Intensity,Frequency") ---
void processCommand(String incomingCommand) {
  incomingCommand.trim();
  int commaIndex = incomingCommand.indexOf(',');

  if (commaIndex > 0) {
    String intensityStr = incomingCommand.substring(0, commaIndex);
    String frequencyStr = incomingCommand.substring(commaIndex + 1);

    currentIntensity = constrain(intensityStr.toInt(), 0, 255);
    currentFrequency = max(0.0f, frequencyStr.toFloat());

    updateStrobeState();

    Serial.print("ACK: Intensity set to ");
    Serial.print(currentIntensity);
    Serial.print(", Frequency set to ");
    Serial.println(currentFrequency);
  }
}

// --- HTTP API: Root Status Page ---
void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  String html = "<!DOCTYPE html><html><head><title>Strobe Light Controller</title>"
                "<meta name='viewport' content='width=device-width, initial-scale=1'>"
                "<style>"
                "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #fff; text-align: center; padding: 30px; }"
                ".card { background: #161b22; border: 1px solid #30363d; padding: 24px; border-radius: 12px; display: inline-block; max-width: 440px; text-align: left; }"
                "h1 { color: #58a6ff; font-size: 1.4rem; margin-top: 0; }"
                ".badge { background: #238636; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; display: inline-block; margin-bottom: 12px; }"
                ".info { color: #8b949e; font-size: 0.9rem; line-height: 1.6; }"
                ".code { background: #070b14; padding: 3px 8px; border-radius: 4px; font-family: monospace; color: #f0883e; }"
                "</style></head><body><div class='card'>"
                "<span class='badge'>ESP32 AP ONLINE</span>"
                "<h1>Strobe Light Controller</h1>"
                "<div class='info'>"
                "<p><b>SSID:</b> <span class='code'>StrobeLight_AP</span></p>"
                "<p><b>IP Address:</b> <span class='code'>192.168.4.1</span></p>"
                "<p><b>Current Intensity:</b> " + String(currentIntensity) + "/255</p>"
                "<p><b>Current Frequency:</b> " + String(currentFrequency) + " Hz</p>"
                "<hr style='border-color: #30363d; margin: 16px 0;'>"
                "<p style='font-size: 0.8rem;'>System is actively listening for serial and Wi-Fi HTTP commands.</p>"
                "</div></div></body></html>";
  server.send(200, "text/html", html);
}

// --- HTTP API: Command Endpoint (/cmd?val=Intensity,Frequency) ---
void handleCmd() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (server.hasArg("val")) {
    String cmd = server.arg("val");
    processCommand(cmd);
    String resp = "ACK: Intensity=" + String(currentIntensity) + ", Freq=" + String(currentFrequency);
    server.send(200, "text/plain", resp);
  } else {
    server.send(400, "text/plain", "ERROR: Missing 'val' query parameter");
  }
}

// --- HTTP API: CORS Preflight Handler ---
void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.send(204);
}

// --- HTTP API: Not Found Handler ---
void handleNotFound() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  if (server.method() == HTTP_OPTIONS) {
    server.send(204);
  } else {
    server.send(404, "text/plain", "Not Found");
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);

#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(mosfetPin, pwmCarrierFreq, pwmRes);
#else
  ledcSetup(pwmChannel, pwmCarrierFreq, pwmRes);
  ledcAttachPin(mosfetPin, pwmChannel);
#endif

  writePwm(0);
  updateStrobeState();

  WiFi.mode(WIFI_AP);
  WiFi.softAP(ap_ssid, ap_password);
  IPAddress apIP = WiFi.softAPIP();

  server.on("/", HTTP_GET, handleRoot);
  server.on("/cmd", HTTP_GET, handleCmd);
  server.on("/cmd", HTTP_OPTIONS, handleOptions);
  server.onNotFound(handleNotFound);

  server.begin();

  Serial.println("\n===========================================");
  Serial.println("  ESP32 STROBE LIGHT CONTROLLER FIRMWARE   ");
  Serial.println("===========================================");
  Serial.print("Wi-Fi SoftAP SSID: ");
  Serial.println(ap_ssid);
  Serial.print("Wi-Fi Password:    ");
  Serial.println(ap_password);
  Serial.print("ESP32 IP Address:  ");
  Serial.println(apIP);
  Serial.println("HTTP WebServer:    Listening on Port 80");
  Serial.println("PWM Carrier:       5000 Hz (LEDC 8-bit)");
  Serial.println("MOSFET Pin:        GPIO 23");
  Serial.println("-------------------------------------------");
  Serial.println("System Ready. Awaiting commands (Format: Intensity,Frequency)");
  Serial.println("===========================================\n");
}

void loop() {
  server.handleClient();
  if (Serial.available() > 0) {
    String incomingCommand = Serial.readStringUntil('\\n');
    processCommand(incomingCommand);
  }
}`;
                navigator.clipboard.writeText(code);
              }}
            >
              <Copy size={14} />
              Copy C++ Source Code
            </button>
          </div>

          <pre style={{
            background: '#070b14',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: '#e2e8f0',
            overflowX: 'auto',
            maxHeight: '420px'
          }}>
            {`/*
 * Subject Stimulus Controller Firmware (Ticker Hardware Timer Engine)
 * Hardware: ESP32 + IRLZ44N MOSFET + 12V 10W COB LED
 * Signal path: USB Serial / Wi-Fi AP -> ESP32 -> MOSFET Gate (Pin 23)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Ticker.h>

const char* ap_ssid = "StrobeLight_AP";
const char* ap_password = "strobe1234";

WebServer server(80);

const int mosfetPin = 23;      
const int pwmCarrierFreq = 5000;      
const int pwmRes = 8;          

volatile int currentIntensity = 0;      
volatile float currentFrequency = 0;    
Ticker strobeTicker;

void IRAM_ATTR onStrobeTimer() {
  // Interrupt Service Routine toggles PWM duty cycle at precise intervals
}

void setup() {
  Serial.begin(115200);
  ledcAttach(mosfetPin, pwmCarrierFreq, pwmRes);
  updateStrobeState();

  WiFi.mode(WIFI_AP);
  WiFi.softAP(ap_ssid, ap_password);
  server.on("/", HTTP_GET, handleRoot);
  server.on("/cmd", HTTP_GET, handleCmd);
  server.begin();
}

void loop() {
  server.handleClient();
  if (Serial.available() > 0) {
    processCommand(Serial.readStringUntil('\\n'));
  }
}`}
          </pre>
        </div>
      )}
    </div>
  );
}

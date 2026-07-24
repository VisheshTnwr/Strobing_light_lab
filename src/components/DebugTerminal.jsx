import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, Copy, Pause, Play, Filter, ShieldCheck } from 'lucide-react';

export function DebugTerminal({
  logs,
  clearLogs,
  onSendRawCommand,
  isConnected,
  lineEnding,
  setLineEnding,
}) {
  const [inputText, setInputText] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, TX, RX, ERR, SYS
  const [autoScroll, setAutoScroll] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const logContainerRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    onSendRawCommand(inputText.trim());
    setHistory((prev) => [...prev, inputText.trim()]);
    setHistoryIndex(-1);
    setInputText('');
  };

  // Keyboard navigation for history (Up / Down arrows)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputText(history[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex >= history.length) {
          setHistoryIndex(-1);
          setInputText('');
        } else {
          setHistoryIndex(nextIndex);
          setInputText(history[nextIndex]);
        }
      }
    }
  };

  const copyLogsToClipboard = () => {
    const text = logs.map((l) => `[${l.time}] [${l.type}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterType === 'ALL') return true;
    return l.type === filterType;
  });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '380px' }}>
      {/* Terminal Header & Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          <Terminal size={20} color="var(--accent-cyan)" />
          Diagnostic Serial Monitor & Command Line
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Line Ending Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Delimiter:</span>
            <select
              value={lineEnding}
              onChange={(e) => setLineEnding(e.target.value)}
              style={{
                background: '#1e293b',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.75rem',
              }}
            >
              <option value="\n">LF (\n)</option>
              <option value="\r\n">CRLF (\r\n)</option>
              <option value="">None</option>
            </select>
          </div>

          {/* Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Filter size={14} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                background: '#1e293b',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.75rem',
              }}
            >
              <option value="ALL">All Logs</option>
              <option value="TX">TX (Sent)</option>
              <option value="RX">RX (Received)</option>
              <option value="ERR">Errors</option>
              <option value="SYS">System</option>
            </select>
          </div>

          {/* Auto-scroll toggle */}
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Pause Auto-Scroll' : 'Resume Auto-Scroll'}
          >
            {autoScroll ? <Pause size={14} /> : <Play size={14} />}
            {autoScroll ? 'Pause' : 'Scroll'}
          </button>

          {/* Copy logs */}
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            onClick={copyLogsToClipboard}
            title="Copy all logs to clipboard"
          >
            <Copy size={14} />
            Copy
          </button>

          {/* Clear logs */}
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-red)' }}
            onClick={clearLogs}
            title="Clear Log Terminal"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Display Window */}
      <div
        ref={logContainerRef}
        style={{
          flex: 1,
          background: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minHeight: '220px',
          maxHeight: '350px',
        }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ color: '#4b5563', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
            No serial log events yet. Connect your ESP32 serial port to monitor live communication.
          </div>
        ) : (
          filteredLogs.map((log) => {
            let typeColor = '#9ca3af';
            let bg = 'transparent';

            if (log.type === 'TX') {
              typeColor = 'var(--accent-cyan)';
            } else if (log.type === 'RX') {
              typeColor = 'var(--accent-green)';
              if (log.message.includes('ACK')) bg = 'rgba(16, 185, 129, 0.05)';
            } else if (log.type === 'ERR') {
              typeColor = 'var(--accent-red)';
              bg = 'rgba(239, 68, 68, 0.1)';
            } else if (log.type === 'SYS') {
              typeColor = 'var(--accent-amber)';
            }

            return (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  background: bg,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  lineHeight: '1.4',
                }}
              >
                <span style={{ color: '#4b5563', userSelect: 'none' }}>[{log.time}]</span>
                <span style={{ color: typeColor, fontWeight: '600', minWidth: '45px', userSelect: 'none' }}>
                  [{log.type}]
                </span>
                <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Command Input Line */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? 'Type raw command (e.g. 255,40 or 0,0) and press Enter...' : 'Connect Serial Port first to send commands'}
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
          Send
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          disabled={!isConnected}
          onClick={() => onSendRawCommand('0,0')}
          title="Quick Send 0,0 Ping"
          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
        >
          <ShieldCheck size={16} />
          Ping 0,0
        </button>
      </form>
    </div>
  );
}

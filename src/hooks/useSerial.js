import { useState, useRef, useCallback, useEffect } from 'react';

export function useSerial() {
  const [port, setPort] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [baudRate, setBaudRate] = useState(115200);
  const [lineEnding, setLineEnding] = useState('\n'); // '\n', '\r\n', or ''
  const [logs, setLogs] = useState([]);
  const [lastAck, setLastAck] = useState(null);
  const [lastAckTime, setLastAckTime] = useState(null);
  const [txCount, setTxCount] = useState(0);
  const [rxCount, setRxCount] = useState(0);
  const [txBytes, setTxBytes] = useState(0);
  const [rxBytes, setRxBytes] = useState(0);
  const [ackCount, setAckCount] = useState(0);
  const [lastLatencyMs, setLastLatencyMs] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [portInfo, setPortInfo] = useState(null);

  const readerRef = useRef(null);
  const keepReadingRef = useRef(false);
  const lastTxTimeRef = useRef(null);

  const isWebSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  const addLog = useCallback((type, message) => {
    const timeStr = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
    setLogs((prev) => [
      ...prev.slice(-999), // Keep max 1000 log lines for dev debug
      { id: Date.now() + Math.random(), time: timeStr, timestamp: Date.now(), type, message },
    ]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Export logs to TXT or JSON file
  const exportLogs = useCallback((format = 'txt') => {
    if (logs.length === 0) return;
    let content = '';
    let mimeType = 'text/plain';
    let filename = `esp32_debug_logs_${Date.now()}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(logs, null, 2);
      mimeType = 'application/json';
    } else {
      content = logs.map((l) => `[${l.time}] [${l.type}] ${l.message}`).join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  // Continuous background serial reader loop
  const readSerialLoop = useCallback(async (currentPort) => {
    if (!currentPort || !currentPort.readable) return;

    keepReadingRef.current = true;
    const reader = currentPort.readable.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();
    let buffer = '';

    addLog('SYS', 'Serial listening loop started.');

    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) {
          addLog('SYS', 'Serial stream reader closed.');
          break;
        }
        if (value) {
          setRxBytes((b) => b + value.byteLength);
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Retain incomplete line fragment in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
              setRxCount((c) => c + 1);
              addLog('RX', trimmed);
              if (trimmed.includes('ACK') || trimmed.includes('Ready')) {
                const now = Date.now();
                setLastAck(trimmed);
                setLastAckTime(new Date().toLocaleTimeString());
                setAckCount((ac) => ac + 1);

                if (lastTxTimeRef.current) {
                  const latency = now - lastTxTimeRef.current;
                  setLastLatencyMs(latency);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      if (keepReadingRef.current) {
        console.error('Serial read loop error:', err);
        addLog('ERR', `Read Error: ${err.message}`);
      }
    } finally {
      try {
        reader.releaseLock();
      } catch (e) {
        // ignore if already released
      }
    }
  }, [addLog]);

  // Connect to Serial Port
  const connectPort = useCallback(async (selectedBaud = baudRate) => {
    if (!isWebSerialSupported) {
      setErrorMsg('Web Serial API is not supported in this browser/environment.');
      return false;
    }

    // Ensure selectedBaud is a valid number (handles React event objects being passed from onClick={onConnect})
    let targetBaud = 115200;
    if (typeof selectedBaud === 'number' && !isNaN(selectedBaud) && selectedBaud > 0) {
      targetBaud = selectedBaud;
    } else if (typeof selectedBaud === 'string' && !isNaN(Number(selectedBaud))) {
      targetBaud = Number(selectedBaud);
    } else if (typeof baudRate === 'number' && !isNaN(baudRate) && baudRate > 0) {
      targetBaud = baudRate;
    }

    try {
      setErrorMsg(null);
      addLog('SYS', 'Prompting for Serial Port selection...');
      
      const selectedPort = await navigator.serial.requestPort();
      
      addLog('SYS', `Opening serial port connection @ ${targetBaud} baud...`);
      await selectedPort.open({ baudRate: targetBaud });

      try {
        await selectedPort.setSignals({ dataTerminalReady: true, requestToSend: false });
      } catch (sigErr) {
        console.warn('Could not set DTR/RTS signals:', sigErr);
      }

      setPort(selectedPort);
      setIsConnected(true);

      const info = selectedPort.getInfo ? selectedPort.getInfo() : {};
      setPortInfo({
        usbVendorId: info.usbVendorId ? `0x${info.usbVendorId.toString(16).toUpperCase()}` : 'N/A',
        usbProductId: info.usbProductId ? `0x${info.usbProductId.toString(16).toUpperCase()}` : 'N/A',
        baudRate: targetBaud,
      });

      addLog('SYS', `SUCCESSFULLY CONNECTED @ ${targetBaud} baud.`);

      readSerialLoop(selectedPort);
      return true;
    } catch (err) {
      console.error('Serial connection error:', err);
      let rawMsg = err.message || 'Failed to connect to serial port.';
      let friendlyMsg = rawMsg;

      if (rawMsg.includes('No port selected') || rawMsg.includes('User cancelled')) {
        friendlyMsg = 'Port selection cancelled. Click "Connect Light" to select your ESP32 COM port.';
        addLog('SYS', friendlyMsg);
      } else if (rawMsg.includes('Failed to open') || rawMsg.includes('Access denied') || rawMsg.includes('already open')) {
        friendlyMsg = 'COM Port is locked or in use by another program (e.g. Arduino IDE Serial Monitor). Please close Arduino IDE Serial Monitor and retry.';
        addLog('ERR', friendlyMsg);
      } else {
        addLog('ERR', `Connection Failed: ${rawMsg}`);
      }

      setErrorMsg(friendlyMsg);
      setIsConnected(false);
      return false;
    }
  }, [baudRate, isWebSerialSupported, addLog, readSerialLoop]);

  // Disconnect Port
  const disconnectPort = useCallback(async () => {
    keepReadingRef.current = false;

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        // ignore
      }
      readerRef.current = null;
    }

    if (port) {
      try {
        await port.close();
        addLog('SYS', 'DISCONNECTED serial port.');
      } catch (err) {
        console.error('Error closing port:', err);
        addLog('ERR', `Error closing port: ${err.message}`);
      }
    }

    setPort(null);
    setIsConnected(false);
    setPortInfo(null);
  }, [port, addLog]);

  // Send Command String to ESP32
  const sendCommand = useCallback(async (rawText) => {
    if (!port || !port.writable) {
      addLog('ERR', `Cannot send "${rawText}": Serial port is not connected.`);
      return false;
    }

    try {
      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();
      const textToSend = rawText + lineEnding;
      const encoded = encoder.encode(textToSend);

      lastTxTimeRef.current = Date.now();
      await writer.write(encoded);
      writer.releaseLock();

      setTxCount((c) => c + 1);
      setTxBytes((b) => b + encoded.byteLength);
      addLog('TX', rawText);
      return true;
    } catch (err) {
      console.error('Failed to write to serial port:', err);
      addLog('ERR', `TX Error: ${err.message}`);
      return false;
    }
  }, [port, lineEnding, addLog]);

  // Reset metrics counters
  const resetMetrics = useCallback(() => {
    setTxCount(0);
    setRxCount(0);
    setTxBytes(0);
    setRxBytes(0);
    setAckCount(0);
    setLastLatencyMs(null);
    addLog('SYS', 'Dev metrics counters reset.');
  }, [addLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnectPort();
      }
    };
  }, [isConnected, disconnectPort]);

  return {
    isWebSerialSupported,
    isConnected,
    connectPort,
    disconnectPort,
    sendCommand,
    baudRate,
    setBaudRate,
    lineEnding,
    setLineEnding,
    logs,
    clearLogs,
    exportLogs,
    lastAck,
    lastAckTime,
    txCount,
    rxCount,
    txBytes,
    rxBytes,
    ackCount,
    lastLatencyMs,
    resetMetrics,
    errorMsg,
    portInfo,
  };
}


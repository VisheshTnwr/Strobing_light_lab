import { useState, useRef, useCallback, useEffect } from "react";
import { CapacitorHttp, Capacitor } from "@capacitor/core";

// Smart fetch wrapper that uses Capacitor Native HTTP on mobile to bypass Android WebView CORS & Mixed-Content blocks
async function smartFetch(url, options = {}) {
  const isNative = typeof Capacitor !== "undefined" && Capacitor.isNativePlatform();
  if (isNative) {
    try {
      const response = await CapacitorHttp.get({
        url: url,
        connectTimeout: 4000,
        readTimeout: 4000,
      });
      const ok = response.status >= 200 && response.status < 300;
      const responseData =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data || "");
      return {
        ok,
        status: response.status,
        text: async () => responseData,
      };
    } catch (err) {
      console.error("Native CapacitorHttp error:", err);
      throw err;
    }
  } else {
    return await fetch(url, options);
  }
}

export function useSerial() {
  const [connectionMode, setConnectionMode] = useState("wifi"); // Default to 'wifi' for mobile usability
  const [ipAddress, setIpAddress] = useState("192.168.4.1");
  const [port, setPort] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [baudRate, setBaudRate] = useState(115200);
  const [lineEnding, setLineEnding] = useState("\n");
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

  const isWebSerialSupported =
    typeof navigator !== "undefined" && "serial" in navigator;

  const addLog = useCallback((type, message) => {
    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
    setLogs((prev) => [
      ...prev.slice(-999),
      {
        id: Date.now() + Math.random(),
        time: timeStr,
        timestamp: Date.now(),
        type,
        message,
      },
    ]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const exportLogs = useCallback(
    (format = "txt") => {
      if (logs.length === 0) return;
      let content = "";
      let mimeType = "text/plain";
      let filename = `esp32_debug_logs_${Date.now()}.${format}`;

      if (format === "json") {
        content = JSON.stringify(logs, null, 2);
        mimeType = "application/json";
      } else {
        content = logs
          .map((l) => `[${l.time}] [${l.type}] ${l.message}`)
          .join("\n");
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [logs],
  );

  // USB Serial reading loop
  const readSerialLoop = useCallback(
    async (currentPort) => {
      if (!currentPort || !currentPort.readable) return;

      keepReadingRef.current = true;
      const reader = currentPort.readable.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      addLog("SYS", "Serial listening loop started.");

      try {
        while (keepReadingRef.current) {
          const { value, done } = await reader.read();
          if (done) {
            addLog("SYS", "Serial stream reader closed.");
            break;
          }
          if (value) {
            setRxBytes((b) => b + value.byteLength);
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed) {
                setRxCount((c) => c + 1);
                addLog("RX", trimmed);
                if (trimmed.includes("ACK") || trimmed.includes("Ready")) {
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
          console.error("Serial read loop error:", err);
          addLog("ERR", `Read Error: ${err.message}`);
        }
      } finally {
        try {
          reader.releaseLock();
        } catch (e) {
          // ignore
        }
      }
    },
    [addLog],
  );

  // Connect via Wi-Fi AP
  const connectWifi = useCallback(
    async (targetIp = ipAddress) => {
      setErrorMsg(null);
      addLog("SYS", `Attempting connection to ESP32 Wi-Fi @ http://${targetIp}`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await smartFetch(`http://${targetIp}/`, {
          signal: controller.signal,
          mode: "cors",
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          setIsConnected(true);
          setConnectionMode("wifi");
          setPortInfo({
            mode: "Wi-Fi AP",
            ipAddress: targetIp,
            ssid: "StrobeLight_AP",
          });
          addLog("SYS", `SUCCESSFULLY CONNECTED via Wi-Fi @ http://${targetIp}`);
          return true;
        } else {
          throw new Error(`HTTP Status ${res.status}`);
        }
      } catch (err) {
        console.error("Wi-Fi connection error:", err);
        let msg = `Wi-Fi connection failed: Ensure mobile Wi-Fi is connected to "StrobeLight_AP" (Password: strobe1234) and Mobile Data is turned off.`;
        setErrorMsg(msg);
        addLog("ERR", msg);
        setIsConnected(false);
        return false;
      }
    },
    [ipAddress, addLog],
  );

  // Disconnect Wi-Fi
  const disconnectWifi = useCallback(() => {
    setIsConnected(false);
    setPortInfo(null);
    addLog("SYS", "DISCONNECTED from Wi-Fi.");
  }, [addLog]);

  // Connect USB Serial Port
  const connectPort = useCallback(
    async (selectedBaud = baudRate) => {
      if (connectionMode === "wifi") {
        return connectWifi();
      }

      if (!isWebSerialSupported) {
        setErrorMsg("Web Serial API is not supported in this browser/environment.");
        return false;
      }

      let targetBaud = 115200;
      if (typeof selectedBaud === "number" && !isNaN(selectedBaud) && selectedBaud > 0) {
        targetBaud = selectedBaud;
      } else if (typeof selectedBaud === "string" && !isNaN(Number(selectedBaud))) {
        targetBaud = Number(selectedBaud);
      } else if (typeof baudRate === "number" && !isNaN(baudRate) && baudRate > 0) {
        targetBaud = baudRate;
      }

      try {
        setErrorMsg(null);
        addLog("SYS", "Prompting for Serial Port selection...");

        const selectedPort = await navigator.serial.requestPort();

        addLog("SYS", `Opening serial port connection @ ${targetBaud} baud...`);
        await selectedPort.open({ baudRate: targetBaud });

        try {
          await selectedPort.setSignals({ dataTerminalReady: true, requestToSend: false });
        } catch (sigErr) {
          console.warn("Could not set DTR/RTS signals:", sigErr);
        }

        setPort(selectedPort);
        setIsConnected(true);
        setConnectionMode("usb");

        const info = selectedPort.getInfo ? selectedPort.getInfo() : {};
        setPortInfo({
          mode: "USB Serial",
          usbVendorId: info.usbVendorId ? `0x${info.usbVendorId.toString(16).toUpperCase()}` : "N/A",
          usbProductId: info.usbProductId ? `0x${info.usbProductId.toString(16).toUpperCase()}` : "N/A",
          baudRate: targetBaud,
        });

        addLog("SYS", `SUCCESSFULLY CONNECTED @ ${targetBaud} baud.`);
        readSerialLoop(selectedPort);
        return true;
      } catch (err) {
        console.error("Serial connection error:", err);
        let rawMsg = err.message || "Failed to connect to serial port.";
        let friendlyMsg = rawMsg;

        if (rawMsg.includes("No port selected") || rawMsg.includes("User cancelled")) {
          friendlyMsg = 'Port selection cancelled. Click "Connect Light" to select your ESP32 COM port.';
          addLog("SYS", friendlyMsg);
        } else if (rawMsg.includes("Failed to open") || rawMsg.includes("Access denied") || rawMsg.includes("already open")) {
          friendlyMsg = "COM Port is locked or in use by another program (e.g. Arduino IDE Serial Monitor). Please close Arduino IDE Serial Monitor and retry.";
          addLog("ERR", friendlyMsg);
        } else {
          addLog("ERR", `Connection Failed: ${rawMsg}`);
        }

        setErrorMsg(friendlyMsg);
        setIsConnected(false);
        return false;
      }
    },
    [baudRate, connectionMode, isWebSerialSupported, addLog, readSerialLoop, connectWifi],
  );

  // Disconnect Port / Connection
  const disconnectPort = useCallback(async () => {
    if (connectionMode === "wifi") {
      disconnectWifi();
      return;
    }

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
        addLog("SYS", "DISCONNECTED serial port.");
      } catch (err) {
        console.error("Error closing port:", err);
        addLog("ERR", `Error closing port: ${err.message}`);
      }
    }

    setPort(null);
    setIsConnected(false);
    setPortInfo(null);
  }, [connectionMode, port, addLog, disconnectWifi]);

  // Unified Send Command (Handles USB and Wi-Fi)
  const sendCommand = useCallback(
    async (rawText) => {
      lastTxTimeRef.current = Date.now();

      // MODE A: Wi-Fi HTTP Transmission
      if (connectionMode === "wifi") {
        if (!isConnected) {
          addLog("ERR", `Cannot send "${rawText}": Wi-Fi is not connected.`);
          return false;
        }

        try {
          const url = `http://${ipAddress}/cmd?val=${encodeURIComponent(rawText)}`;
          addLog("TX", `[Wi-Fi] ${rawText}`);
          setTxCount((c) => c + 1);

          const res = await smartFetch(url);
          const responseText = await res.text();
          const latency = Date.now() - lastTxTimeRef.current;

          setRxCount((c) => c + 1);
          setRxBytes((b) => b + responseText.length);
          addLog("RX", `[Wi-Fi] ${responseText}`);

          if (responseText.includes("ACK")) {
            setLastAck(responseText);
            setLastAckTime(new Date().toLocaleTimeString());
            setAckCount((ac) => ac + 1);
            setLastLatencyMs(latency);
          }
          return true;
        } catch (err) {
          console.error("Wi-Fi send error:", err);
          addLog("ERR", `Wi-Fi TX Error: ${err.message}`);
          return false;
        }
      }

      // MODE B: USB Serial Transmission
      if (!port || !port.writable) {
        addLog("ERR", `Cannot send "${rawText}": Serial port is not connected.`);
        return false;
      }

      try {
        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();
        const textToSend = rawText + lineEnding;
        const encoded = encoder.encode(textToSend);

        await writer.write(encoded);
        writer.releaseLock();

        setTxCount((c) => c + 1);
        setTxBytes((b) => b + encoded.byteLength);
        addLog("TX", rawText);
        return true;
      } catch (err) {
        console.error("Failed to write to serial port:", err);
        addLog("ERR", `TX Error: ${err.message}`);
        return false;
      }
    },
    [connectionMode, isConnected, ipAddress, port, lineEnding, addLog],
  );

  // Reset metrics counters
  const resetMetrics = useCallback(() => {
    setTxCount(0);
    setRxCount(0);
    setTxBytes(0);
    setRxBytes(0);
    setAckCount(0);
    setLastLatencyMs(null);
    addLog("SYS", "Dev metrics counters reset.");
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
    connectionMode,
    setConnectionMode,
    ipAddress,
    setIpAddress,
    connectWifi,
    disconnectWifi,
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

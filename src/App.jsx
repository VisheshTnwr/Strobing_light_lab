import React, { useState } from "react";
import { useSerial } from "./hooks/useSerial";
import { Header } from "./components/Header";
import { MinimalUserDashboard } from "./components/MinimalUserDashboard";
import { DevDashboard } from "./components/DevDashboard";
import { DevAuthModal } from "./components/DevAuthModal";

export function App() {
  const {
    connectionMode,
    setConnectionMode,
    ipAddress,
    setIpAddress,
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
  } = useSerial();

  const [activeTab, setActiveTab] = useState("user");
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [intensity, setIntensity] = useState(128); // Default 50%
  const [frequency, setFrequency] = useState(10); // Default 10Hz

  // Handle Tab Switch with Password Check
  const handleSelectTab = (tabName) => {
    if (tabName === "dev") {
      if (isDevUnlocked) {
        setActiveTab("dev");
      } else {
        setIsAuthModalOpen(true);
      }
    } else {
      setActiveTab("user");
    }
  };

  // Successful Password Unlock
  const handleAuthSuccess = () => {
    setIsDevUnlocked(true);
    setIsAuthModalOpen(false);
    setActiveTab("dev");
  };

  // Lock Dev Tab & return to User Dashboard
  const handleLockDev = () => {
    setIsDevUnlocked(false);
    setActiveTab("user");
  };

  // Send parameters to hardware
  const handleTransmit = React.useCallback(
    (intVal = intensity, freqVal = frequency) => {
      const cmdStr = `${intVal},${freqVal}`;
      sendCommand(cmdStr);
    },
    [intensity, frequency, sendCommand],
  );

  // Turn off light completely
  const handleTurnOff = React.useCallback(() => {
    sendCommand("0,0");
  }, [sendCommand]);

  return (
    <div
      className="app-container"
      style={{
        maxWidth: activeTab === "user" ? "950px" : "1500px",
        margin: "0 auto",
      }}
    >
      {/* Minimal Header with Wi-Fi / USB Switcher */}
      <Header
        isConnected={isConnected}
        onConnect={connectPort}
        onDisconnect={disconnectPort}
        onEmergencyStop={handleTurnOff}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isDevUnlocked={isDevUnlocked}
        onLockDev={handleLockDev}
        logCount={logs.length}
        connectionMode={connectionMode}
        setConnectionMode={setConnectionMode}
        ipAddress={ipAddress}
        setIpAddress={setIpAddress}
      />

      {/* TAB 1: MINIMALISTIC TIMER-DRIVEN USER DASHBOARD */}
      {activeTab === "user" && (
        <MinimalUserDashboard
          isConnected={isConnected}
          onTransmit={handleTransmit}
          onTurnOff={handleTurnOff}
          intensity={intensity}
          setIntensity={setIntensity}
          frequency={frequency}
          setFrequency={setFrequency}
        />
      )}

      {/* TAB 2: DEV TAB (DEBUG & COMMANDS) */}
      {activeTab === "dev" && (
        <DevDashboard
          isConnected={isConnected}
          onConnect={connectPort}
          onDisconnect={disconnectPort}
          baudRate={baudRate}
          setBaudRate={setBaudRate}
          lineEnding={lineEnding}
          setLineEnding={setLineEnding}
          errorMsg={errorMsg}
          logs={logs}
          clearLogs={clearLogs}
          exportLogs={exportLogs}
          onSendRawCommand={sendCommand}
          txCount={txCount}
          rxCount={rxCount}
          txBytes={txBytes}
          rxBytes={rxBytes}
          ackCount={ackCount}
          lastLatencyMs={lastLatencyMs}
          lastAck={lastAck}
          lastAckTime={lastAckTime}
          portInfo={portInfo}
          resetMetrics={resetMetrics}
          currentIntensity={intensity}
          currentFrequency={frequency}
          onLockDev={handleLockDev}
          onSelectPreset={(pIntensity, pFrequency) => {
            setIntensity(pIntensity);
            setFrequency(pFrequency);
            handleTransmit(pIntensity, pFrequency);
          }}
        />
      )}

      {/* Dev Password Authentication Modal */}
      <DevAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;

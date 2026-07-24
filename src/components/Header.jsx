import React from "react";
import {
  Zap,
  AlertTriangle,
  Power,
  Sliders,
  Lock,
  Unlock,
  Wifi,
  Usb,
} from "lucide-react";

export function Header({
  isConnected,
  onConnect,
  onDisconnect,
  onEmergencyStop,
  activeTab,
  onSelectTab,
  isDevUnlocked,
  onLockDev,
  logCount,
  connectionMode,
  setConnectionMode,
  ipAddress,
  setIpAddress,
}) {
  return (
    <header
      className="card"
      style={{
        padding: "14px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Top Bar: Title, Connection Mode, & Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px var(--accent-cyan-glow)",
            }}
          >
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.15rem",
                fontWeight: "700",
                margin: 0,
                letterSpacing: "-0.02em",
                fontFamily: "var(--font-heading)",
              }}
            >
              Strobing Light Controller
            </h1>
            <div
              style={{
                fontSize: "0.75rem",
                color: isConnected
                  ? "var(--accent-green)"
                  : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "2px",
              }}
            >
              <span
                className="pulse-dot"
                style={{
                  background: isConnected ? "var(--accent-green)" : "#64748b",
                }}
              ></span>
              {isConnected
                ? `Connected via ${connectionMode === "wifi" ? "Wi-Fi AP" : "USB Serial"}`
                : "Not Connected"}
            </div>
          </div>
        </div>

        {/* Connection Controls & Mode Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Mode Selector Toggle */}
          {!isConnected && (
            <div
              style={{
                display: "flex",
                background: "var(--bg-card-hover)",
                borderRadius: "8px",
                padding: "3px",
                border: "1px solid var(--border-color)",
              }}
            >
              <button
                className="btn"
                onClick={() => setConnectionMode("wifi")}
                style={{
                  padding: "5px 10px",
                  fontSize: "0.75rem",
                  borderRadius: "5px",
                  background: connectionMode === "wifi" ? "var(--accent-cyan)" : "transparent",
                  color: connectionMode === "wifi" ? "#fff" : "var(--text-muted)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Wifi size={13} />
                Wi-Fi AP
              </button>

              <button
                className="btn"
                onClick={() => setConnectionMode("usb")}
                style={{
                  padding: "5px 10px",
                  fontSize: "0.75rem",
                  borderRadius: "5px",
                  background: connectionMode === "usb" ? "var(--accent-cyan)" : "transparent",
                  color: connectionMode === "usb" ? "#fff" : "var(--text-muted)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Usb size={13} />
                USB Serial
              </button>
            </div>
          )}

          {/* Wi-Fi IP input if in Wi-Fi mode */}
          {!isConnected && connectionMode === "wifi" && (
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="192.168.4.1"
              style={{
                width: "110px",
                padding: "6px 8px",
                fontSize: "0.78rem",
                borderRadius: "6px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-color)",
                color: "#fff",
              }}
              title="ESP32 Access Point IP Address"
            />
          )}

          {!isConnected ? (
            <button
              className="btn btn-primary"
              onClick={() => onConnect()}
              style={{ padding: "8px 16px", fontSize: "0.82rem" }}
            >
              <Power size={15} />
              {connectionMode === "wifi" ? "Connect Wi-Fi" : "Connect Light"}
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={onDisconnect}
              style={{
                padding: "8px 14px",
                fontSize: "0.8rem",
                color: "var(--accent-red)",
              }}
            >
              <Power size={14} />
              Disconnect
            </button>
          )}

          <button
            className="btn btn-danger"
            onClick={onEmergencyStop}
            style={{ padding: "8px 16px", fontSize: "0.82rem" }}
          >
            <AlertTriangle size={15} />
            TURN LIGHT OFF
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--border-color)",
          paddingTop: "10px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            className={`btn ${activeTab === "user" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => onSelectTab("user")}
            style={{
              padding: "6px 14px",
              fontSize: "0.8rem",
              borderRadius: "6px",
            }}
          >
            <Sliders size={14} />
            User Dashboard
          </button>

          <button
            className={`btn ${activeTab === "dev" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => onSelectTab("dev")}
            style={{
              padding: "6px 14px",
              fontSize: "0.8rem",
              borderRadius: "6px",
              background:
                activeTab === "dev"
                  ? "linear-gradient(135deg, #8b5cf6, #0ea5e9)"
                  : undefined,
            }}
          >
            {isDevUnlocked ? (
              <Unlock size={14} color="var(--accent-green)" />
            ) : (
              <Lock size={14} color="var(--accent-amber)" />
            )}
            Dev Tab (Debug & Commands)
            {logCount > 0 && (
              <span
                style={{
                  fontSize: "0.65rem",
                  background:
                    activeTab === "dev"
                      ? "rgba(255,255,255,0.25)"
                      : "var(--accent-cyan)",
                  color: "#fff",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  marginLeft: "6px",
                  fontWeight: "700",
                }}
              >
                {logCount}
              </span>
            )}
          </button>
        </div>

        {/* Lock Dev Tab Button when unlocked */}
        {isDevUnlocked && (
          <button
            className="btn btn-secondary"
            onClick={onLockDev}
            style={{
              padding: "4px 12px",
              fontSize: "0.75rem",
              color: "var(--accent-amber)",
              borderRadius: "6px",
            }}
            title="Lock Dev Tab and return to User Dashboard"
          >
            <Lock size={13} />
            Lock Dev Tab
          </button>
        )}
      </div>
    </header>
  );
}

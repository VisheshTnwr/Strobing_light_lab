import React, { useEffect, useRef } from "react";
import { Activity, Zap, Radio, Sliders } from "lucide-react";

export function OscilloscopeView({ intensity, frequency }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let offset = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.fillStyle = "#070b14";
      ctx.fillRect(0, 0, width, height);

      // Draw Grid Lines
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;

      
      // Horizontal grid lines
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Center Reference Axis (0V)
      const zeroY = height - 35;
      const maxY = 35;
      const amplitude = zeroY - maxY; // height difference for 12V / Max PWM

      ctx.strokeStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(width, zeroY);
      ctx.stroke();

      // Label axes
      ctx.fillStyle = "#64748b";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillText("12.0V (100% PWM)", 10, maxY - 8);
      ctx.fillText("0.0V (GND)", 10, zeroY + 15);

      // Draw Signal Trace
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 10;
      ctx.beginPath();

      const dutyFraction = intensity / 255;
      const highVoltageY = zeroY - amplitude * dutyFraction;

      if (intensity === 0) {
        // Continuous OFF
        ctx.moveTo(0, zeroY);
        ctx.lineTo(width, zeroY);
      } else if (frequency === 0) {
        // Continuous DC ON
        ctx.moveTo(0, highVoltageY);
        ctx.lineTo(width, highVoltageY);
      } else {
        // Pulse Wave Strobe
        const wavelengthPixels = Math.max(30, 600 / frequency);
        const halfWavelength = wavelengthPixels / 2;

        offset = (offset + frequency * 0.8) % wavelengthPixels;

        let currentX = 0;
        let isHigh = true;

        ctx.moveTo(0, isHigh ? highVoltageY : zeroY);

        for (
          let x = -offset;
          x < width + wavelengthPixels;
          x += halfWavelength
        ) {
          const nextY = isHigh ? highVoltageY : zeroY;
          ctx.lineTo(Math.max(0, Math.min(width, x)), nextY);
          isHigh = !isHigh;
          ctx.lineTo(
            Math.max(0, Math.min(width, x)),
            isHigh ? highVoltageY : zeroY,
          );
        }
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow glow

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, frequency]);

  const periodMs = frequency > 0 ? (1000 / frequency).toFixed(1) : "∞";
  const dutyPct = Math.round((intensity / 255) * 100);

  return (
    <div
      className="card"
      style={{ display: "flex", flexDirection: "column", gap: "14px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 className="card-title" style={{ margin: 0 }}>
          <Activity size={20} color="var(--accent-cyan)" />
          MOSFET Output Signal Oscilloscope (GPIO 23 Signal)
        </h2>

        <div
          style={{
            display: "flex",
            gap: "12px",
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span style={{ color: "var(--accent-cyan)" }}>
            Freq: <strong>{frequency} Hz</strong>
          </span>
          <span style={{ color: "var(--accent-amber)" }}>
            Duty: <strong>{dutyPct}%</strong> ({intensity}/255)
          </span>
          <span style={{ color: "var(--accent-green)" }}>
            Period: <strong>{periodMs} ms</strong>
          </span>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          background: "#070b14",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #1e293b",
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={240}
          style={{ width: "100%", height: "240px", display: "block" }}
        />

        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <div>
            Mode:{" "}
            <strong style={{ color: "#fff" }}>
              {frequency === 0 ? "DC Continuous" : "Square Wave Pulse"}
            </strong>
          </div>
          <div>
            Voltage:{" "}
            <strong style={{ color: "var(--accent-amber)" }}>
              {((intensity / 255) * 12).toFixed(1)} V (Peak)
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

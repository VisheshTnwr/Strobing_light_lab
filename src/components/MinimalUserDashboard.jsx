import React, { useState, useEffect, useRef } from 'react';
import { Sun, Radio, Clock, Play, Pause, Square, CheckCircle } from 'lucide-react';
import { StrobeVisualizer } from './StrobeVisualizer';

export function MinimalUserDashboard({
  isConnected,
  onTransmit,
  onTurnOff,
  intensity,
  setIntensity,
  frequency,
  setFrequency,
}) {
  const [durationSeconds, setDurationSeconds] = useState(300); // Default 5 minutes (300s)
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Custom Time Input State
  const [customMins, setCustomMins] = useState('5');
  const [customSecs, setCustomSecs] = useState('0');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Refs for callbacks to prevent re-render loops
  const onTransmitRef = useRef(onTransmit);
  const onTurnOffRef = useRef(onTurnOff);

  useEffect(() => {
    onTransmitRef.current = onTransmit;
    onTurnOffRef.current = onTurnOff;
  }, [onTransmit, onTurnOff]);

  // Select duration preset
  const handleSelectDuration = (seconds) => {
    if (isRunning) return;
    setDurationSeconds(seconds);
    setTimeLeft(seconds);
    setIsFinished(false);
    setShowCustomInput(false);
  };

  // Apply custom time (mins & secs)
  const handleApplyCustomTime = (e) => {
    e?.preventDefault();
    if (isRunning) return;
    const mins = Math.max(0, parseInt(customMins || '0', 10));
    const secs = Math.max(0, parseInt(customSecs || '0', 10));
    const totalSecs = (mins * 60) + secs;
    if (totalSecs > 0) {
      setDurationSeconds(totalSecs);
      setTimeLeft(totalSecs);
      setIsFinished(false);
    }
  };

  // Intensity slider change
  const handleIntensityChange = (val) => {
    setIntensity(val);
    if (isRunning && isConnected) {
      onTransmitRef.current(val, frequency);
    }
  };

  // Frequency slider change
  const handleFrequencyChange = (val) => {
    setFrequency(val);
    if (isRunning && isConnected) {
      onTransmitRef.current(intensity, val);
    }
  };

  // START LIGHT SESSION
  const handleStartSession = () => {
    if (!isConnected) return;

    if (!isRunning && !isPaused) {
      const targetTime = timeLeft <= 0 ? durationSeconds : timeLeft;
      setTimeLeft(targetTime);
      onTransmitRef.current(intensity, frequency);
    } else if (isPaused) {
      onTransmitRef.current(intensity, frequency);
    }

    setIsRunning(true);
    setIsPaused(false);
    setIsFinished(false);
  };

  // PAUSE SESSION
  const handlePauseSession = () => {
    setIsRunning(false);
    setIsPaused(true);
    onTurnOffRef.current();
  };

  // STOP SESSION
  const handleStopSession = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(durationSeconds);
    setIsFinished(false);
    onTurnOffRef.current();
  };

  // Stable Countdown Timer Tick Effect
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          setIsFinished(true);
          onTurnOffRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  // Format time MM:SS
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPct = durationSeconds > 0 ? Math.min(100, Math.max(0, ((durationSeconds - timeLeft) / durationSeconds) * 100)) : 0;
  const brightnessPct = Math.round((intensity / 255) * 100);

  return (
    <div style={{
      maxWidth: '820px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Step 1: Light Parameter Controls */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="card-title" style={{ margin: 0, fontSize: '1.05rem' }}>
            <Sun size={18} color="var(--accent-amber)" />
            1. Light Settings
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${isRunning ? 'badge-connected' : 'badge-disconnected'}`}>
              {isRunning ? '🟢 Output Active' : '⚪ Standby'}
            </span>
            {isConnected && (
              <button
                className={`btn ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => {
                  if (isRunning) {
                    handlePauseSession();
                  } else {
                    handleStartSession();
                  }
                }}
              >
                {isRunning ? 'Turn OFF' : '⚡ Turn Light ON'}
              </button>
            )}
          </div>
        </div>

        {/* Intensity / Brightness */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
            <label style={{ fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sun size={15} color="var(--accent-amber)" />
              Brightness:
            </label>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-amber)', fontSize: '0.95rem' }}>
              {brightnessPct}% <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({intensity}/255)</span>
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="255"
            step="1"
            value={intensity}
            onChange={(e) => handleIntensityChange(Number(e.target.value))}
          />

          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            {[
              { label: 'OFF', val: 0 },
              { label: '25%', val: 64 },
              { label: '50%', val: 128 },
              { label: '75%', val: 192 },
              { label: '100%', val: 255 },
            ].map((item) => (
              <button
                key={item.val}
                className={`btn ${intensity === item.val ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '6px', fontSize: '0.75rem', borderRadius: '6px' }}
                onClick={() => handleIntensityChange(item.val)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strobe Frequency */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
            <label style={{ fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={15} color="var(--accent-cyan)" />
              Strobe Speed:
            </label>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
              {frequency === 0 ? 'Solid Light (0 Hz)' : `${frequency} Hz`}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={frequency}
            onChange={(e) => handleFrequencyChange(Number(e.target.value))}
          />

          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            {[
              { label: 'Solid', val: 0 },
              { label: '5 Hz', val: 5 },
              { label: '10 Hz', val: 10 },
              { label: '20 Hz', val: 20 },
              { label: '40 Hz', val: 40 },
            ].map((item) => (
              <button
                key={item.val}
                className={`btn ${frequency === item.val ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '6px', fontSize: '0.75rem', borderRadius: '6px' }}
                onClick={() => handleFrequencyChange(item.val)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: Duration & Execution Card */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="card-title" style={{ margin: 0, fontSize: '1.05rem' }}>
            <Clock size={18} color="var(--accent-cyan)" />
            2. Duration & Execution
          </h2>

          <button
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem', borderRadius: '6px', color: showCustomInput ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}
            disabled={isRunning}
            onClick={() => setShowCustomInput(!showCustomInput)}
          >
            {showCustomInput ? 'Presets' : '+ Custom Time'}
          </button>
        </div>

        {/* Duration Selection Presets */}
        {!showCustomInput ? (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: '30 sec', sec: 30 },
              { label: '1 min', sec: 60 },
              { label: '2 min', sec: 120 },
              { label: '5 min', sec: 300 },
              { label: '10 min', sec: 600 },
              { label: '15 min', sec: 900 },
            ].map((item) => (
              <button
                key={item.sec}
                className={`btn ${durationSeconds === item.sec && !isRunning ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, minWidth: '60px', padding: '6px 10px', fontSize: '0.78rem', borderRadius: '6px' }}
                disabled={isRunning}
                onClick={() => handleSelectDuration(item.sec)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleApplyCustomTime} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                min="0"
                max="999"
                value={customMins}
                onChange={(e) => setCustomMins(e.target.value)}
                placeholder="0"
                style={{
                  width: '60px',
                  background: '#07090e',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '6px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Mins</span>
            </div>

            <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>:</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                min="0"
                max="59"
                value={customSecs}
                onChange={(e) => setCustomSecs(e.target.value)}
                placeholder="0"
                style={{
                  width: '60px',
                  background: '#07090e',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '6px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Secs</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px' }}>
              Apply Custom Time
            </button>
          </form>
        )}

        {/* Digital Countdown Box */}
        <div style={{
          background: '#07090e',
          border: `1px solid ${isRunning ? 'var(--accent-cyan)' : isFinished ? 'var(--accent-green)' : 'var(--border-color)'}`,
          borderRadius: '10px',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.2s ease'
        }}>
          <div style={{
            fontSize: '3.4rem',
            fontWeight: '800',
            fontFamily: 'var(--font-mono)',
            color: isRunning ? 'var(--accent-cyan)' : isFinished ? 'var(--accent-green)' : '#ffffff',
            letterSpacing: '0.05em'
          }}>
            {formatTime(timeLeft)}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isRunning
              ? `Running: ${brightnessPct}% Brightness @ ${frequency === 0 ? 'Solid' : `${frequency}Hz`}`
              : isPaused
              ? 'Session Paused'
              : isFinished
              ? 'Session Complete — Light powered OFF'
              : `Press Start to run light for ${formatTime(durationSeconds)} (${brightnessPct}% / ${frequency}Hz)`}
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '4px',
            background: '#1e293b',
            borderRadius: '2px',
            marginTop: '14px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              background: isFinished ? 'var(--accent-green)' : 'var(--accent-cyan)',
              transition: 'width 0.3s linear'
            }} />
          </div>
        </div>

        {/* Finished Banner Alert */}
        {isFinished && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '8px',
            color: 'var(--accent-green)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} />
            <span>Session complete! Light automatically turned off.</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {!isRunning ? (
            <button
              className="btn btn-primary"
              style={{ flex: 2, padding: '12px', fontSize: '0.9rem' }}
              disabled={!isConnected}
              onClick={handleStartSession}
            >
              <Play size={16} />
              {!isConnected
                ? 'Connect Light First'
                : isPaused
                ? 'Resume Light Session'
                : `START LIGHT SESSION (${formatTime(durationSeconds)})`}
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              style={{ flex: 2, padding: '12px', fontSize: '0.9rem', color: 'var(--accent-amber)' }}
              onClick={handlePauseSession}
            >
              <Pause size={16} />
              Pause Session
            </button>
          )}

          <button
            className="btn btn-secondary"
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem', color: 'var(--accent-red)' }}
            onClick={handleStopSession}
          >
            <Square size={15} />
            Stop & Turn Off
          </button>
        </div>
      </div>

      {/* Visualizer Footer */}
      <StrobeVisualizer intensity={isRunning ? intensity : 0} frequency={frequency} />
    </div>
  );
}

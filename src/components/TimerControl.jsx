import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Square, CheckCircle, Sliders, Zap } from 'lucide-react';

export function TimerControl({ isConnected, onEmergencyStop, onTransmit, intensity, frequency }) {
  const [durationSeconds, setDurationSeconds] = useState(300); // Default 5 minutes
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Custom Time Input State
  const [customMins, setCustomMins] = useState('5');
  const [customSecs, setCustomSecs] = useState('0');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const timerRef = useRef(null);

  // Update timer remaining when user changes duration while stopped
  const handleSelectDuration = (seconds) => {
    if (isRunning) return;
    setDurationSeconds(seconds);
    setTimeLeft(seconds);
    setIsFinished(false);
    setShowCustomInput(false);
  };

  // Apply Custom Minutes & Seconds
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

  // Start Timer Session - Immediately turns on light with target settings and starts countdown
  const handleStart = () => {
    if (!isRunning && !isPaused) {
      if (timeLeft <= 0) setTimeLeft(durationSeconds);
      // Turn on light with current intensity and frequency settings
      onTransmit(intensity, frequency);
    }
    setIsRunning(true);
    setIsPaused(false);
    setIsFinished(false);
  };

  // Pause Timer Session
  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  // Reset / Stop Timer Session
  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(durationSeconds);
    setIsFinished(false);
    // Automatically turn off light safely
    onEmergencyStop();
  };

  // Countdown Effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Session Complete! Automatically shut off light
      setIsRunning(false);
      setIsPaused(false);
      setIsFinished(true);
      onEmergencyStop();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, onEmergencyStop]);

  // Format MM:SS
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate percentage elapsed
  const progressPct = durationSeconds > 0 ? Math.min(100, Math.max(0, ((durationSeconds - timeLeft) / durationSeconds) * 100)) : 0;
  const brightnessPct = Math.round((intensity / 255) * 100);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="card-title" style={{ margin: 0, fontSize: '1.2rem' }}>
          <Clock size={22} color="var(--accent-cyan)" />
          Light Duration & Timer Control
        </h2>

        {isRunning && (
          <span className="badge badge-connected" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <span className="pulse-dot"></span>
            Light ON & Timer Active
          </span>
        )}
      </div>

      {/* Target Light Settings Summary Box */}
      <div style={{
        background: '#111827',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.85rem'
      }}>
        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={16} color="var(--accent-cyan)" />
          <span>Active Light Target:</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--accent-amber)' }}>Brightness: {brightnessPct}% ({intensity}/255)</span>
          <span style={{ color: 'var(--accent-cyan)' }}>Speed: {frequency === 0 ? 'Solid' : `${frequency} Hz`}</span>
        </div>
      </div>

      {/* Duration Selection Presets & Custom Time Toggle */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select Session Duration:</span>
          <button
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: '0.75rem', color: showCustomInput ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}
            disabled={isRunning}
            onClick={() => setShowCustomInput(!showCustomInput)}
          >
            {showCustomInput ? 'Use Presets' : '+ Custom Time'}
          </button>
        </div>

        {!showCustomInput ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                style={{ flex: 1, minWidth: '60px', padding: '8px', fontSize: '0.8rem' }}
                disabled={isRunning}
                onClick={() => handleSelectDuration(item.sec)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleApplyCustomTime} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                  background: '#090d16',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '6px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mins</span>
            </div>

            <span style={{ fontWeight: '700' }}>:</span>

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
                  background: '#090d16',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '6px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Secs</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Apply Custom Time
            </button>
          </form>
        )}
      </div>

      {/* Countdown Timer Display Box */}
      <div style={{
        background: '#070b14',
        border: `2px solid ${isRunning ? 'var(--accent-cyan)' : isFinished ? 'var(--accent-green)' : 'var(--border-color)'}`,
        borderRadius: '12px',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          fontSize: '3.2rem',
          fontWeight: '800',
          fontFamily: 'var(--font-mono)',
          color: isRunning ? 'var(--accent-cyan)' : isFinished ? 'var(--accent-green)' : '#fff',
          letterSpacing: '0.05em'
        }}>
          {formatTime(timeLeft)}
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {isRunning
            ? `Light ON: ${formatTime(timeLeft)} remaining (${brightnessPct}% / ${frequency}Hz)`
            : isPaused
            ? 'Session Paused'
            : isFinished
            ? 'Session Complete — Light powered OFF'
            : 'Press Start Session to turn ON light with timer'}
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          background: '#1e293b',
          borderRadius: '3px',
          marginTop: '16px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPct}%`,
            height: '100%',
            background: isFinished ? 'var(--accent-green)' : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
            transition: 'width 0.3s linear'
          }} />
        </div>
      </div>

      {/* Finished Banner Alert */}
      {isFinished && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          color: 'var(--accent-green)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={18} />
          <span>Stimulus session finished! Light turned off automatically.</span>
        </div>
      )}

      {/* Primary Control Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {!isRunning ? (
          <button
            className="btn btn-primary"
            style={{ flex: 2, padding: '14px', fontSize: '0.95rem', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
            onClick={handleStart}
          >
            <Play size={18} />
            {isPaused ? 'Resume Light Session' : `Start Light Session (${formatTime(durationSeconds)})`}
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            style={{ flex: 2, padding: '14px', fontSize: '0.95rem', color: 'var(--accent-amber)' }}
            onClick={handlePause}
          >
            <Pause size={18} />
            Pause Session
          </button>
        )}

        <button
          className="btn btn-secondary"
          style={{ flex: 1, padding: '14px', fontSize: '0.9rem', color: 'var(--accent-red)' }}
          onClick={handleStop}
        >
          <Square size={18} />
          Stop & Turn Off
        </button>
      </div>
    </div>
  );
}

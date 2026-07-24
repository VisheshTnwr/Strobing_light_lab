import React, { useState } from 'react';
import { Lock, Key, AlertCircle, X, ShieldCheck } from 'lucide-react';

export function DevAuthModal({ isOpen, onClose, onSuccess }) {
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwordInput.trim() === 'debug') {
      setErrorMsg('');
      setPasswordInput('');
      onSuccess();
    } else {
      setErrorMsg('Incorrect password. Access denied.');
    }
  };

  const handleClose = () => {
    setErrorMsg('');
    setPasswordInput('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 16, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        border: '1px solid var(--border-highlight)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.15)',
            color: 'var(--accent-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <Lock size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
              Developer Access
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Enter security password to open Dev Tab
            </p>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Developer Password:
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                autoFocus
                style={{
                  width: '100%',
                  background: '#090d16',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 12px 10px 36px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: 'var(--accent-red)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, padding: '10px' }}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}
            >
              <ShieldCheck size={16} />
              Unlock Dev Tab
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { C } from '../../../constants/designToken';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  passwordToggle?: boolean;
  passwordToggleColor?: string;
}

function EyeOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export const Input: React.FC<InputProps> = ({
  label,
  style,
  passwordToggle,
  passwordToggleColor = C.green,
  type,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hasPasswordToggle = passwordToggle && type === 'password';
  const inputType = hasPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: C.gray,
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '15px',
    fontWeight: 600,
    backgroundColor: C.surface,
    color: C.white,
    padding: '14px',
    borderRadius: '14px',
    border: isFocused ? `1.5px solid ${C.purple}` : `1.5px solid transparent`,
    boxShadow: `0 3px 0 ${C.dim}`,
    outline: 'none',
    transition: 'border 0.22s ease',
    width: '100%',
    boxSizing: 'border-box',
    ...style,
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type={inputType}
          style={{
            ...inputStyle,
            paddingRight: hasPasswordToggle ? '44px' : inputStyle.padding,
          }}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {hasPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: passwordToggleColor,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
          </button>
        )}
      </div>
    </div>
  );
};
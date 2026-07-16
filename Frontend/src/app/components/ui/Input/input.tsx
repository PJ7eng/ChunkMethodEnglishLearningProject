import React, { useState } from 'react';
import { C } from '../../../constants/designToken';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, style, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

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
      <input
        style={inputStyle}
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
    </div>
  );
};
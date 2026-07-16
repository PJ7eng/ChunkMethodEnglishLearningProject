import React from 'react';
import { C } from '../../../constants/designToken';
import { usePress } from '../../../hooks/usePress';

export interface LoginBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  disabled?: boolean;
}
  
export function LoginBtn({
  children,
  onClick,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  disabled = false,
}: LoginBtnProps) {
  const { pressed, handlers } = usePress();


  const colors = {
    primary: { bg: C.green, shadow: C.greenDark, text: C.white },
    secondary: { bg: C.purple, shadow: C.purpleDk, text: C.white },
    ghost: { bg: 'transparent', shadow: 'transparent', text: C.gray },
  };

  const currentColors = colors[variant];


  const sizes = {
    sm: { fontSize: '13px', padding: '9px 18px' },
    md: { fontSize: '15px', padding: '13px 22px' },
    lg: { fontSize: '18px', padding: '17px 28px' },
    xl: { fontSize: '21px', padding: '20px 0' },
  };

  const currentSize = sizes[size];

  const buttonStyle: React.CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: currentSize.fontSize,
    padding: currentSize.padding,
    backgroundColor: currentColors.bg,
    color: currentColors.text,
    border: 'none',
    borderRadius: '16px',
    width: fullWidth ? '100%' : 'auto',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,

    boxShadow: (pressed && !disabled) || variant === 'ghost' ? 'none' : `0 5px 0 ${currentColors.shadow}`,
    transform: (pressed && !disabled) && variant !== 'ghost' ? 'translateY(5px)' : 'translateY(0)',
    transition: 'transform 0.08s ease, box-shadow 0.08s ease',
    outline: 'none',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  return (
    <button
      style={buttonStyle}
      onClick={!disabled ? onClick : undefined}
      {...handlers}
    >
      {children}
    </button>
  );
};
import React, { useState } from 'react';
import { C } from '../../constants/designToken';
import { LoginBtn, Input } from '../../components';
import { registerUser } from '../../api';
import { AuthScreenProps } from '../../types/auth';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export function RegisterScreen({
  onAuthSuccess,
  onSwitchToLogin,
}: AuthScreenProps & RegisterProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMatch = password === confirmPassword;
  const showPasswordMismatch =
    confirmPassword.length > 0 && !passwordsMatch;
  const canRegister =
    username.trim() !== '' &&
    email.trim() !== '' &&
    password !== '' &&
    confirmPassword !== '' &&
    passwordsMatch;

  const handleRegister = async () => {
    if (!canRegister) return;

    const data = await registerUser(email, password, username);
    onAuthSuccess(data.token, data.user);
    console.log('Register with:', username, email, password);
  };

  const pageStyle: React.CSSProperties = {
    backgroundColor: C.bg,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
    boxSizing: 'border-box',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '22px',
    fontWeight: 900,
    color: C.white,
    textAlign: 'center',
    marginBottom: '28px',
  };

  const warningStyle: React.CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: C.red,
    marginTop: '-8px',
    marginBottom: '8px',
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>創建你的檔案</h1>

        <Input
          type="text"
          placeholder="輸入用戶名"
          label="用戶名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type="email"
          placeholder="輸入郵箱"
          label="電子郵件"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          passwordToggle
          passwordToggleColor={C.purple}
          placeholder="設置密碼"
          label="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          passwordToggle
          passwordToggleColor={C.purple}
          placeholder="再次輸入密碼"
          label="確認密碼"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={
            showPasswordMismatch
              ? { border: `1.5px solid ${C.red}` }
              : undefined
          }
        />
        {showPasswordMismatch && (
          <p style={warningStyle}>兩次輸入的密碼不一致，請重新確認</p>
        )}

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <LoginBtn
            variant="secondary"
            fullWidth
            disabled={!canRegister}
            onClick={handleRegister}
          >
            創建帳號
          </LoginBtn>
          <LoginBtn variant="ghost" fullWidth onClick={onSwitchToLogin}>
            已有帳號？點此登錄
          </LoginBtn>
        </div>
      </div>
    </div>
  );
}

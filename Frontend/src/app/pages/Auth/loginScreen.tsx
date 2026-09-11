import React, { useState } from 'react';
import { C } from '../../constants/designToken';
import { LoginBtn, Input } from '../../components';
import { loginUser, requestPasswordReset, resendVerificationEmail, saveAuthSession, userFacingError, validateEmail } from '../../api';
import { AuthScreenProps } from '../../types/auth';

export interface LoginProps {
  onSwitchToRegister: () => void;
}

export function LoginScreen({
  onAuthSuccess,
  onSwitchToRegister,
}: AuthScreenProps & LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(email, password);
      if (!data.token || !data.user) {
        throw new Error(data.message || 'Login failed');
      }
      await saveAuthSession(data);
      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError(userFacingError(err, '無法登入。請稍後再試。'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError('請先輸入有效的電子郵件。');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const result = await requestPasswordReset(email);
      setInfo(result.message);
    } catch (err) {
      setError(userFacingError(err, '無法寄送重設郵件'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError('請先輸入有效的電子郵件。');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await resendVerificationEmail(email);
      setInfo('若此信箱尚未驗證，我們已寄出新的驗證信。');
    } catch (err) {
      setError(userFacingError(err, '無法寄送驗證信'));
    } finally {
      setLoading(false);
    }
  };

  const pageStyle: React.CSSProperties = {
    backgroundColor: C.bg,
    minHeight: '100dvh',
    maxHeight: '100dvh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 'calc(var(--safe-top) + 20px) calc(var(--safe-right) + 20px) calc(var(--safe-bottom) + 20px) calc(var(--safe-left) + 20px)',
    boxSizing: 'border-box',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    margin: 'auto 0',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '22px',
    fontWeight: 900,
    color: C.white,
    textAlign: 'center',
    marginBottom: '28px',
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>歡迎回來！</h1>

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
          placeholder="輸入密碼"
          label="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: C.red,
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
        {info && <p style={{ color: C.green, margin: 0, fontWeight: 700 }}>{info}</p>}

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <LoginBtn variant="primary" fullWidth onClick={handleLogin} disabled={loading}>
            {loading ? '登錄中...' : '登錄'}
          </LoginBtn>
          <LoginBtn variant="ghost" fullWidth onClick={onSwitchToRegister}>
            沒有帳號？點此註冊
          </LoginBtn>
          <LoginBtn variant="ghost" fullWidth onClick={handleForgotPassword} disabled={loading}>
            忘記密碼
          </LoginBtn>
          <LoginBtn variant="ghost" fullWidth onClick={handleResendVerification} disabled={loading}>
            重寄驗證信
          </LoginBtn>
        </div>
      </div>
    </div>
  );
}

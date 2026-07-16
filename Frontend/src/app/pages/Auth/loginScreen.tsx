import React, { useState } from 'react';
import { C } from '../../constants/designToken';
import {LoginBtn, Input} from '../../components';
import { loginUser } from '../../api';
import { AuthScreenProps } from '../../types/auth';

export interface LoginProps {
  onSwitchToRegister: () => void;
}

export function LoginScreen({
  onAuthSuccess, 
  onSwitchToRegister
}: AuthScreenProps & LoginProps) {
    
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  

  const handleLogin = async () => { 
    const data = await loginUser( email, password);
    onAuthSuccess(data.token, data.user);
    console.log('Login with:', email, password);
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
          placeholder="輸入密碼" 
          label="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <LoginBtn variant="primary" fullWidth onClick={handleLogin}>
            登錄
          </LoginBtn>
          <LoginBtn variant="ghost" fullWidth onClick={onSwitchToRegister}>
            沒有帳號？點此註冊
          </LoginBtn>
        </div>
      </div>
    </div>
  );
};
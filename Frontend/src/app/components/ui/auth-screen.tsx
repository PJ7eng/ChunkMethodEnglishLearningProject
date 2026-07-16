// Frontend/src/app/components/AuthScreen.tsx
import React, { useState } from 'react';
import { Button } from './Nonutils/button';
import { Input } from './Nonutils/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Nonutils/card';
import { registerUser, loginUser } from '../../api';

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // 登入流程
        const data = await loginUser(email, password);
        onAuthSuccess(data.token, data.user);
      } else {
        // 註冊流程 -> 成功後直接調用 onAuthSuccess 實現自動登入
        const data = await registerUser(email, password, name);
        onAuthSuccess(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during the authentication process. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-50">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 text-zinc-50 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-50">
            {isLogin ? '歡迎回來 ChunkLearning' : '建立您的學習帳戶'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {isLogin ? '請輸入您的帳號密碼以繼續學習' : '通過組塊學習法，開啟高效語感建立之旅'}
          </CardDescription>
        </CardHeader>
        
        {/* 自定義 User-Friendly 切換分頁 */}
        <div className="grid w-[90%] grid-cols-2 p-1 bg-zinc-950 rounded-lg mx-auto mb-4 border border-zinc-800">
          <button
            type="button"
            className={`py-1.5 text-sm font-medium rounded-md transition-all ${
              isLogin ? 'bg-zinc-800 text-zinc-50 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => { setIsLogin(true); setError(null); }}
          >
            登入
          </button>
          <button
            type="button"
            className={`py-1.5 text-sm font-medium rounded-md transition-all ${
              !isLogin ? 'bg-zinc-800 text-zinc-50 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => { setIsLogin(false); setError(null); }}
          >
            註冊
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-950/50 border border-red-900 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">暱稱 / 姓名</label>
                <Input
                  type="text"
                  placeholder="例如：查理"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-50 focus-visible:ring-zinc-700"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">電子郵件</label>
              <Input
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-50 focus-visible:ring-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">密碼</label>
              <Input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-50 focus-visible:ring-zinc-700"
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 font-medium disabled:opacity-50"
            >
              {loading ? '處理中...' : isLogin ? '登入' : '註冊並開始學習'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
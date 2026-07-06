import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useCurrentUser } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useCurrentUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(username.trim(), password.trim());
    setLoading(false);
    if (!result.success) {
      setError('用户名或密码错误');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">任务管理系统</h1>
          <p className="mt-1 text-sm text-muted-foreground">任务事项后台管理平台</p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-8 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                className="pl-9"
                placeholder="请输入用户名"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className="px-9"
                placeholder="请输入密码"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            如果没有账号，可联系管理员添加：13592518770（微信同号）
          </p>
        </form>
      </div>
    </div>
  );
}

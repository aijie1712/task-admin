import { useState } from 'react';
import { useAccounts } from '@/store';
import { useCurrentUser } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ShieldCheck, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Accounts() {
  const { user } = useCurrentUser();
  const { accounts, addAccount, removeAccount } = useAccounts();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAdd = async () => {
    const u = username.trim();
    const p = password.trim();
    if (!u) { toast.error('请输入用户名'); return; }
    if (!p) { toast.error('请输入密码'); return; }
    if (accounts.some(a => a.username === u)) {
      toast.error('该账号已存在');
      return;
    }
    try {
      await addAccount({ username: u, password: p, isAdmin });
      setUsername('');
      setPassword('');
      setIsAdmin(false);
      setOpen(false);
      toast.success('账号添加成功');
    } catch {
      toast.error('添加失败，请重试');
    }
  };

  if (!user?.isAdmin) {
    navigate('/settings', { replace: true });
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 标题行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            title="返回设置"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
              <Users className="h-4 w-4 text-rose-600" />
            </div>
            <h2 className="text-lg font-semibold">系统账号管理</h2>
          </div>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          新增账号
        </Button>
      </div>

      {/* 账号列表 */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">用户名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">密码</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">角色</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">状态</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.username} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">{acc.username}</td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">********</td>
                  <td className="px-4 py-3">
                    {acc.isAdmin ? (
                      <Badge variant="secondary" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
                        <ShieldCheck className="h-3 w-3" />
                        管理员
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">普通用户</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {acc.username === user.username ? (
                      <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 text-xs">
                        当前账号
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {acc.username !== user.username && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={async () => { await removeAccount(acc.username); toast.success('账号已删除'); }}
                        title="删除账号"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增账号弹窗 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>新增账号</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-user">用户名</Label>
              <Input
                id="add-user"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入用户名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-pwd">密码</Label>
              <Input
                id="add-pwd"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm">管理员权限</span>
              <Switch
                className="data-[state=checked]:!bg-[#6E7DF7]"
                checked={isAdmin}
                onCheckedChange={setIsAdmin}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={handleAdd}>确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

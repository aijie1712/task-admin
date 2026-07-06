import { useState } from 'react';
import { useConfig } from '@/store';
import { useCurrentUser } from '@/store';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Tags, Settings2, UserCircle, RotateCcw, ChevronUp, ChevronDown, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { config, updateConfig } = useConfig();
  const { user } = useCurrentUser();

  const [newMethod, setNewMethod] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newAccount, setNewAccount] = useState('');

  // 合作方式管理
  const addMethod = () => {
    const trimmed = newMethod.trim();
    if (!trimmed) return;
    if (config.cooperationMethods.includes(trimmed)) {
      toast.error('该合作方式已存在');
      return;
    }
    updateConfig({ cooperationMethods: [...config.cooperationMethods, trimmed] });
    setNewMethod('');
    toast.success('添加成功');
  };

  const removeMethod = (method: string) => {
    updateConfig({ cooperationMethods: config.cooperationMethods.filter(m => m !== method) });
    toast.success('已删除');
  };

  // 合作要求管理
  const addRequirement = () => {
    const trimmed = newRequirement.trim();
    if (!trimmed) return;
    if (config.cooperationRequirements.includes(trimmed)) {
      toast.error('该合作要求已存在');
      return;
    }
    updateConfig({ cooperationRequirements: [...config.cooperationRequirements, trimmed] });
    setNewRequirement('');
    toast.success('添加成功');
  };

  const removeRequirement = (req: string) => {
    updateConfig({ cooperationRequirements: config.cooperationRequirements.filter(r => r !== req) });
    toast.success('已删除');
  };

  // 发布账号管理
  const addPublishAccount = () => {
    const trimmed = newAccount.trim();
    if (!trimmed) return;
    if (config.publishAccounts.includes(trimmed)) {
      toast.error('该发布账号已存在');
      return;
    }
    updateConfig({ publishAccounts: [...config.publishAccounts, trimmed] });
    setNewAccount('');
    toast.success('添加成功');
  };

  const removePublishAccount = (account: string) => {
    updateConfig({ publishAccounts: config.publishAccounts.filter(a => a !== account) });
    toast.success('已删除');
  };

  const moveAccount = (index: number, direction: 'up' | 'down') => {
    const accts = [...config.publishAccounts];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= accts.length) return;
    [accts[index], accts[target]] = [accts[target], accts[index]];
    updateConfig({ publishAccounts: accts });
  };

  const resetConfig = () => {
    updateConfig({
      cooperationMethods: ['报备', '置换', '包月', '寄拍', '纯佣', '专场'],
      cooperationRequirements: [
        '图文发布', '视频发布', '直播带货', '小红书种草',
        '抖音推广', '淘宝挂车', '微信推文', '微博转发',
      ],
      publishAccounts: ['小红书-主号', '抖音-主号', '微博-主号', 'B站-主号'],
    });
    toast.success('已恢复默认配置');
  };

  return (
    <div className="space-y-4">
      {/* ===== 管理员：系统账号管理入口 ===== */}
      {user?.isAdmin && (
        <Card className="border-border/60">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                <Users className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium">系统账号管理</p>
                <p className="text-xs text-muted-foreground">管理员专属——管理所有登录账号</p>
              </div>
            </div>
            <Button
              onClick={() => window.location.hash = '#/accounts'}
              className="gap-1.5"
            >
              <UserCircle className="h-4 w-4" />
              管理账号
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 合作方式配置 */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Tags className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">合作方式配置</CardTitle>
              <CardDescription>管理任务的合作方式选项（报备、置换、包月、寄拍等）</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {config.cooperationMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无配置，请添加</p>
            ) : (
              config.cooperationMethods.map(method => (
                <Badge key={method} variant="secondary" className="gap-1.5 py-1.5 text-sm">
                  {method}
                  <button
                    onClick={() => removeMethod(method)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <Separator />
          <div className="flex gap-2">
            <Input
              value={newMethod}
              onChange={e => setNewMethod(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMethod(); } }}
              placeholder="输入新的合作方式"
              className="max-w-xs"
            />
            <Button onClick={addMethod} className="gap-1">
              <Plus className="h-4 w-4" />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 合作要求配置 */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
              <Settings2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base">合作要求配置</CardTitle>
              <CardDescription>管理任务的合作要求选项</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {config.cooperationRequirements.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无配置，请添加</p>
            ) : (
              config.cooperationRequirements.map(req => (
                <Badge key={req} variant="secondary" className="gap-1.5 py-1.5 text-sm">
                  {req}
                  <button
                    onClick={() => removeRequirement(req)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <Separator />
          <div className="flex gap-2">
            <Input
              value={newRequirement}
              onChange={e => setNewRequirement(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRequirement(); } }}
              placeholder="输入新的合作要求"
              className="max-w-xs"
            />
            <Button onClick={addRequirement} className="gap-1">
              <Plus className="h-4 w-4" />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 发布账号配置 */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
              <UserCircle className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">发布账号配置</CardTitle>
              <CardDescription>管理发布账号选项，可拖拽排序。新增任务时默认选中第一个。</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            {config.publishAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无配置，请添加</p>
            ) : (
              config.publishAccounts.map((account, i) => (
                <div key={account} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <span className="flex-1 text-sm font-medium">{account}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveAccount(i, 'up')}
                      disabled={i === 0}
                      className="rounded p-1 hover:bg-accent disabled:opacity-30"
                      title="上移"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveAccount(i, 'down')}
                      disabled={i === config.publishAccounts.length - 1}
                      className="rounded p-1 hover:bg-accent disabled:opacity-30"
                      title="下移"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removePublishAccount(account)}
                    className="ml-1 rounded-full p-1 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newAccount}
              onChange={e => setNewAccount(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPublishAccount(); } }}
              placeholder="输入新的发布账号"
              className="max-w-xs"
            />
            <Button onClick={addPublishAccount} className="gap-1">
              <Plus className="h-4 w-4" />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 重置 */}
      <Card className="border-border/60">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">恢复默认配置</p>
            <p className="text-xs text-muted-foreground">将合作方式和合作要求恢复到初始状态</p>
          </div>
          <Button variant="outline" onClick={resetConfig} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            重置
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

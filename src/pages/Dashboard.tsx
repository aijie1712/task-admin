import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useConfig } from '@/store';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  TrendingUp, Wallet, FileText, Package,
  CheckCircle2, DollarSign, Clock, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Dashboard() {
  const { tasks } = useTasks();
  const { config } = useConfig();
  const navigate = useNavigate();

  const [timeType, setTimeType] = useState<'all' | 'month' | 'year'>('all');
  const [timeValue, setTimeValue] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');

  // 按时间筛选任务
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filterAccount !== 'all') {
      result = result.filter(t => t.publishAccount === filterAccount);
    }
    if (timeType === 'all' || !timeValue) return result;
    return result.filter(t => {
      const date = t.completionDate || (t.isSettled ? t.settlementDate : null) || t.createdAt.slice(0, 10);
      if (timeType === 'month') return date.slice(0, 7) === timeValue;
      if (timeType === 'year') return date.slice(0, 4) === timeValue;
      return true;
    });
  }, [tasks, timeType, timeValue, filterAccount]);

  // 按创建时间生成可选月份/年份列表
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      const d = t.createdAt.slice(0, 7);
      set.add(d);
    });
    return Array.from(set).sort().reverse();
  }, [tasks]);

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      const d = t.createdAt.slice(0, 4);
      set.add(d);
    });
    return Array.from(set).sort().reverse();
  }, [tasks]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const totalAdvance = filteredTasks.reduce((s, t) => s + (t.advanceAmount || 0), 0);
    const totalManuscript = filteredTasks.reduce((s, t) => s + (t.manuscriptFee || 0), 0);
    const totalProduct = filteredTasks.reduce((s, t) => s + (t.productAmount || 0), 0);
    const totalNet = filteredTasks.reduce((s, t) => s + (t.netAmount || 0), 0);
    const completed = filteredTasks.filter(t => t.completionDegree >= 100).length;
    const settled = filteredTasks.filter(t => t.isSettled).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const settlementRate = total > 0 ? (settled / total) * 100 : 0;

    return { total, totalAdvance, totalManuscript, totalProduct, totalNet, completed, settled, completionRate, settlementRate };
  }, [filteredTasks]);

  // 按合作方式统计
  const methodData = useMemo(() => {
    const map = new Map<string, { name: string; count: number; netAmount: number }>();
    filteredTasks.forEach(t => {
      const key = t.cooperationMethod || '未分类';
      const existing = map.get(key) || { name: key, count: 0, netAmount: 0 };
      existing.count += 1;
      existing.netAmount += t.netAmount || 0;
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [filteredTasks]);

  // 按月统计到手金额
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { month: string; netAmount: number; manuscriptFee: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthTasks = filteredTasks.filter(t => {
        const date = t.completionDate || t.createdAt.slice(0, 7);
        return date.startsWith(key);
      });
      months.push({
        month: key,
        netAmount: monthTasks.reduce((s, t) => s + (t.netAmount || 0), 0),
        manuscriptFee: monthTasks.reduce((s, t) => s + (t.manuscriptFee || 0), 0),
      });
    }
    return months;
  }, [filteredTasks]);

  const cards = [
    { label: '任务总数', value: stats.total.toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '垫付总额', value: formatMoney(stats.totalAdvance), icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '稿费总额', value: formatMoney(stats.totalManuscript), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '商品总额', value: formatMoney(stats.totalProduct), icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '到手总额', value: formatMoney(stats.totalNet), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '完成率', value: `${stats.completionRate.toFixed(1)}%`, icon: CheckCircle2, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: '结算率', value: `${stats.settlementRate.toFixed(1)}%`, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '已完成/已结算', value: `${stats.completed}/${stats.settled}`, icon: BarChart3, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      {/* 时间筛选 */}
      <Card className="border-border/60">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <Label className="text-xs">筛选维度</Label>
            <Select value={timeType} onValueChange={v => { setTimeType(v as 'all' | 'month' | 'year'); setTimeValue(''); }}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部数据</SelectItem>
                <SelectItem value="month">按月份</SelectItem>
                <SelectItem value="year">按年份</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {timeType !== 'all' && (
            <div className="space-y-1">
              <Label className="text-xs">{timeType === 'month' ? '选择月份' : '选择年份'}</Label>
              <Select value={timeValue} onValueChange={v => setTimeValue(v)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder={timeType === 'month' ? '选择月份' : '选择年份'} />
                </SelectTrigger>
                <SelectContent>
                  {(timeType === 'month' ? monthOptions : yearOptions).map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">发布账号</Label>
            <Select value={filterAccount} onValueChange={v => setFilterAccount(v)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部账号</SelectItem>
                {config.publishAccounts.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground">
            当前显示 <strong className="text-foreground">{stats.total}</strong> 条记录
          </span>
        </CardContent>
      </Card>

      {/* 指标卡片 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card
              key={i}
              className={`border-border/60 ${i === 0 ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}
              onClick={i === 0 ? () => navigate('/tasks') : undefined}
            >
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground lg:text-sm">{card.label}</p>
                    <p className="text-lg font-bold lg:text-2xl">{card.value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg} lg:h-12 lg:w-12`}>
                    <Icon className={`h-5 w-5 ${card.color} lg:h-6 lg:w-6`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 月度趋势 */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">近 6 个月金额趋势</CardTitle>
            <CardDescription>按完成日期统计到手金额与稿费金额</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => formatMoney(v)}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Line type="monotone" dataKey="netAmount" name="到手金额" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="manuscriptFee" name="稿费金额" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 合作方式分布 */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">合作方式分布</CardTitle>
            <CardDescription>按合作方式统计任务数量与到手金额</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={methodData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={entry => `${entry.name}: ${entry.count}`}
                  labelLine={false}
                >
                  {methodData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 合作方式金额对比 */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">各合作方式到手金额对比</CardTitle>
            <CardDescription>不同合作方式的到手金额合计</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={methodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="netAmount" name="到手金额" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

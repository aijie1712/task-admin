import { useState, useMemo } from 'react';
import { useTasks, useConfig } from '@/store';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { StatPeriod, StatTimeField, StatDimension } from '@/types';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

function formatMoney(n: number): string {
  return `¥${(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const DIMENSION_LABELS: Record<StatDimension, string> = {
  manuscriptFee: '稿费金额',
  productAmount: '商品金额',
  netAmount: '到手金额',
  taskName: '任务名称',
};

const TIME_FIELD_LABELS: Record<StatTimeField, string> = {
  completionDate: '完成时间',
  settlementDate: '结算时间',
};

export default function Statistics() {
  const { tasks } = useTasks();
  const { config } = useConfig();

  const [period, setPeriod] = useState<StatPeriod>('monthly');
  const [timeField, setTimeField] = useState<StatTimeField>('completionDate');
  const [dimension, setDimension] = useState<StatDimension>('netAmount');
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [filterAccount, setFilterAccount] = useState('all');

  // 先过滤发布账号
  const accountFiltered = useMemo(() => {
    if (filterAccount === 'all') return tasks;
    return tasks.filter(t => t.publishAccount === filterAccount);
  }, [tasks, filterAccount]);

  // 可选年份
  const years = useMemo(() => {
    const set = new Set<string>();
    accountFiltered.forEach(t => {
      const date = timeField === 'completionDate' ? t.completionDate : t.settlementDate;
      if (date) set.add(date.slice(0, 4));
    });
    set.add(String(new Date().getFullYear()));
    return Array.from(set).sort().reverse();
  }, [accountFiltered, timeField]);

  // 按时间统计
  const timeData = useMemo(() => {
    const filtered = accountFiltered.filter(t => {
      const date = timeField === 'completionDate' ? t.completionDate : t.settlementDate;
      if (!date) return false;
      if (!date.startsWith(year)) return false;
      return true;
    });

    if (period === 'monthly') {
      const months: { label: string; value: number; count: number }[] = [];
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${String(m).padStart(2, '0')}`;
        const monthTasks = filtered.filter(t => {
          const date = timeField === 'completionDate' ? t.completionDate : t.settlementDate;
          return date && date.slice(0, 7) === key;
        });
        const value = dimension === 'taskName'
          ? monthTasks.length
          : monthTasks.reduce((s, t) => s + (t[dimension] as number || 0), 0);
        months.push({ label: `${m}月`, value, count: monthTasks.length });
      }
      return months;
    } else {
      // yearly - show last 5 years
      const currentYear = parseInt(year);
      const yearlyData: { label: string; value: number; count: number }[] = [];
      for (let y = currentYear - 4; y <= currentYear; y++) {
        const yStr = String(y);
        const yearTasks = accountFiltered.filter(t => {
          const date = timeField === 'completionDate' ? t.completionDate : t.settlementDate;
          return date && date.startsWith(yStr);
        });
        const value = dimension === 'taskName'
          ? yearTasks.length
          : yearTasks.reduce((s, t) => s + (t[dimension] as number || 0), 0);
        yearlyData.push({ label: yStr, value, count: yearTasks.length });
      }
      return yearlyData;
    }
  }, [accountFiltered, period, timeField, dimension, year]);

  // 按合作方式统计维度
  const methodData = useMemo(() => {
    const map = new Map<string, number>();
    accountFiltered.forEach(t => {
      const date = timeField === 'completionDate' ? t.completionDate : t.settlementDate;
      if (!date || !date.startsWith(year)) return;
      const key = t.cooperationMethod || '未分类';
      const val = dimension === 'taskName' ? 1 : (t[dimension] as number || 0);
      map.set(key, (map.get(key) || 0) + val);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [accountFiltered, timeField, dimension, year]);

  // 按任务名称排行
  const taskRanking = useMemo(() => {
    const filtered = accountFiltered.filter(t => {
      const date = timeField === 'completionDate' ? t.completionDate : t.settlementDate;
      if (!date || !date.startsWith(year)) return false;
      return true;
    });

    const ranked = filtered.map(t => {
      const val = dimension === 'taskName' ? 1 : (t[dimension] as number || 0);
      return {
        name: t.taskName,
        method: t.cooperationMethod,
        value: val,
        count: 1,
      };
    });

    return ranked.sort((a, b) => b.value - a.value).slice(0, 20);
  }, [accountFiltered, timeField, dimension, year]);

  // 汇总
  const totalValue = timeData.reduce((s, d) => s + d.value, 0);
  const totalCount = timeData.reduce((s, d) => s + d.count, 0);

  const isMoney = dimension !== 'taskName';

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-xs">统计周期</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as StatPeriod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">按月度</SelectItem>
                  <SelectItem value="yearly">按年度</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">时间维度</Label>
              <Select value={timeField} onValueChange={(v) => setTimeField(v as StatTimeField)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completionDate">完成时间</SelectItem>
                  <SelectItem value="settlementDate">结算时间</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">统计维度</Label>
              <Select value={dimension} onValueChange={(v) => setDimension(v as StatDimension)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manuscriptFee">稿费金额</SelectItem>
                  <SelectItem value="productAmount">商品金额</SelectItem>
                  <SelectItem value="netAmount">到手金额</SelectItem>
                  <SelectItem value="taskName">任务数量</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">年份</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y} 年</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">发布账号</Label>
              <Select value={filterAccount} onValueChange={v => setFilterAccount(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部账号</SelectItem>
                  {config.publishAccounts.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{DIMENSION_LABELS[dimension]}合计</p>
            <p className="mt-1 text-xl font-bold lg:text-2xl">
              {isMoney ? formatMoney(totalValue) : `${totalValue} 个`}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">任务总数</p>
            <p className="mt-1 text-xl font-bold lg:text-2xl">{totalCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">平均值</p>
            <p className="mt-1 text-xl font-bold lg:text-2xl">
              {totalCount > 0
                ? (isMoney ? formatMoney(totalValue / totalCount) : `${(totalValue / totalCount).toFixed(1)} 个`)
                : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 柱状图 */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">
            {period === 'monthly' ? `${year}年` : '近5年'}{DIMENSION_LABELS[dimension]}统计
          </CardTitle>
          <CardDescription>
            按{TIME_FIELD_LABELS[timeField]}{period === 'monthly' ? '月度' : '年度'}分布
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={v => isMoney ? `¥${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip
                formatter={(v: number) => isMoney ? formatMoney(v) : `${v} 个`}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Bar
                dataKey="value"
                name={DIMENSION_LABELS[dimension]}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 饼图：按合作方式 */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">合作方式占比</CardTitle>
            <CardDescription>
              {DIMENSION_LABELS[dimension]}按合作方式分布
            </CardDescription>
          </CardHeader>
          <CardContent>
            {methodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={methodData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={entry => `${entry.name}: ${isMoney ? formatMoney(entry.value) : entry.value}`}
                    labelLine={false}
                  >
                    {methodData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => isMoney ? formatMoney(v) : `${v} 个`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">暂无数据</div>
            )}
          </CardContent>
        </Card>

        {/* 排行表 */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">任务排行 TOP 20</CardTitle>
            <CardDescription>
              按{DIMENSION_LABELS[dimension]}排序
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>任务名称</TableHead>
                    <TableHead>方式</TableHead>
                    <TableHead className="text-right">{DIMENSION_LABELS[dimension]}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskRanking.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">暂无数据</TableCell>
                    </TableRow>
                  ) : (
                    taskRanking.map((task, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="max-w-[150px] truncate font-medium" title={task.name}>{task.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{task.method}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {isMoney ? formatMoney(task.value) : task.value}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 明细表 */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">{period === 'monthly' ? '月度' : '年度'}明细</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{period === 'monthly' ? '月份' : '年份'}</TableHead>
                <TableHead className="text-right">任务数</TableHead>
                <TableHead className="text-right">{DIMENSION_LABELS[dimension]}</TableHead>
                <TableHead className="text-right">平均值</TableHead>
                <TableHead className="text-right">占比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeData.filter(d => d.count > 0).map((d) => (
                <TableRow key={d.label}>
                  <TableCell className="font-medium">{d.label}</TableCell>
                  <TableCell className="text-right">{d.count}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {isMoney ? formatMoney(d.value) : d.value}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {d.count > 0 ? (isMoney ? formatMoney(d.value / d.count) : (d.value / d.count).toFixed(1)) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {totalValue > 0 ? `${((d.value / totalValue) * 100).toFixed(1)}%` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

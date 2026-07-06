import { useState, useMemo, useEffect } from 'react';
import { useTasks, useConfig } from '@/store';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2, FileText, Filter, RotateCcw, CheckCircle2, Banknote, MoreHorizontal, Undo2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { Task } from '@/types';
import TaskForm from '@/components/TaskForm';

function formatMoney(n: number): string {
  return `¥${(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PAGE_SIZE = 10;

export default function TaskList() {
  const { tasks, addTask, updateTask, deleteTask, deleteTasks } = useTasks();
  const { config } = useConfig();

  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterSettled, setFilterSettled] = useState('all');
  const [filterCompleted, setFilterCompleted] = useState('all');
  const [filterReimbursed, setFilterReimbursed] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [monthCreated, setMonthCreated] = useState('');
  const [monthCompleted, setMonthCompleted] = useState('');
  const [monthSettled, setMonthSettled] = useState('');
  const [monthDueDate, setMonthDueDate] = useState('');
  const [page, setPage] = useState(1);

  // 生成所有可用的月份选项（用于下拉选择）
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    tasks.forEach(t => {
      if (t.createdAt) months.add(t.createdAt.slice(0, 7));
      if (t.completionDate) months.add(t.completionDate.slice(0, 7));
      if (t.settlementDate) months.add(t.settlementDate.slice(0, 7));
      if (t.dueDate) months.add(t.dueDate.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [tasks]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  // 筛选或翻页时清除选中
  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, filterMethod, filterSettled, filterCompleted, filterReimbursed, filterAccount,
    monthCreated, monthCompleted, monthSettled, monthDueDate, page]);

  // 过滤
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.taskName.toLowerCase().includes(search.toLowerCase()) && !t.remarks.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (filterMethod !== 'all' && t.cooperationMethod !== filterMethod) return false;
      if (filterSettled === 'settled' && !t.isSettled) return false;
      if (filterSettled === 'unsettled' && t.isSettled) return false;
      if (filterCompleted === 'completed' && t.completionDegree < 100) return false;
      if (filterCompleted === 'pending' && t.completionDegree >= 100) return false;
      if (filterReimbursed === 'reimbursed' && !t.isAdvanceReimbursed) return false;
      if (filterReimbursed === 'unreimbursed' && t.isAdvanceReimbursed) return false;
      if (filterAccount !== 'all' && t.publishAccount !== filterAccount) return false;
      // 月份筛选
      if (monthCreated) {
        const created = t.createdAt.slice(0, 7);
        if (created !== monthCreated) return false;
      }
      if (monthCompleted) {
        if (!t.completionDate || t.completionDate.slice(0, 7) !== monthCompleted) return false;
      }
      if (monthSettled) {
        if (!t.settlementDate || t.settlementDate.slice(0, 7) !== monthSettled) return false;
      }
      if (monthDueDate) {
        if (!t.dueDate || t.dueDate.slice(0, 7) !== monthDueDate) return false;
      }
      return true;
    });
  }, [tasks, search, filterMethod, filterSettled, filterCompleted, filterReimbursed, filterAccount,
    monthCreated, monthCompleted, monthSettled, monthDueDate]);

  // 分页
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 全选/取消全选（必须在 pageData 之后定义）
  const allSelected = pageData.length > 0 && pageData.every(t => selectedIds.has(t.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageData.map(t => t.id)));
    }
  };

  const handleBatchDelete = async () => {
    try {
      await deleteTasks(Array.from(selectedIds));
      toast.success(`成功删除 ${selectedIds.size} 条任务`);
    } catch (e) {
      toast.error('批量删除失败，请检查网络或数据库权限');
    }
    setSelectedIds(new Set());
    setBatchDeleteOpen(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterMethod('all');
    setFilterSettled('all');
    setFilterCompleted('all');
    setFilterReimbursed('all');
    setFilterAccount('all');
    setMonthCreated('');
    setMonthCompleted('');
    setMonthSettled('');
    setMonthDueDate('');
    setPage(1);
  };

  const hasActiveFilters = search || filterMethod !== 'all' || filterSettled !== 'all' || filterCompleted !== 'all' || filterReimbursed !== 'all' || filterAccount !== 'all'
    || monthCreated || monthCompleted || monthSettled || monthDueDate;

  const handleEdit = (task: Task) => {
    setEditing(task);
    setFormOpen(true);
  };

  const handleComplete = (task: Task) => {
    const today = new Date().toISOString().slice(0, 10);
    updateTask(task.id, {
      publishedPosts: task.requiredPosts,
      completionDegree: task.requiredPosts > 0 ? 100 : task.completionDegree,
      completionDate: today,
    });
  };

  const handleSettle = (task: Task) => {
    const today = new Date().toISOString().slice(0, 10);
    updateTask(task.id, {
      isSettled: true,
      settlementDate: task.settlementDate || today,
    });
  };

  const handleReimburse = (task: Task) => {
    updateTask(task.id, { isAdvanceReimbursed: true });
    toast.success('已标记为已回款');
  };

  const handleSubmit = (data: Omit<Task, 'id' | 'updatedAt'>) => {
    if (editing) {
      updateTask(editing.id, data);
    } else {
      addTask(data);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteTask(deleteId);
        toast.success('任务已删除');
      } catch (e) {
        toast.error('删除失败，请检查网络或数据库权限');
      }
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-1">
                <Label className="text-xs">搜索</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="任务名称/备注"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">发布账号</Label>
                <Select value={filterAccount} onValueChange={v => { setFilterAccount(v); setPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {config.publishAccounts.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">合作方式</Label>
                <Select value={filterMethod} onValueChange={v => { setFilterMethod(v); setPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {config.cooperationMethods.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">结算状态</Label>
                <Select value={filterSettled} onValueChange={v => { setFilterSettled(v); setPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="settled">已结算</SelectItem>
                    <SelectItem value="unsettled">未结算</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">完成状态</Label>
                <Select value={filterCompleted} onValueChange={v => { setFilterCompleted(v); setPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="pending">未完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">回款状态</Label>
                <Select value={filterReimbursed} onValueChange={v => { setFilterReimbursed(v); setPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="reimbursed">已回款</SelectItem>
                    <SelectItem value="unreimbursed">未回款</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`gap-1.5 ${showDateFilter ? 'border-primary text-primary' : ''}`}
                onClick={() => setShowDateFilter(!showDateFilter)}
              >
                <Filter className="h-4 w-4" />
                时间筛选
                {(monthCreated || monthCompleted || monthSettled || monthDueDate) && (
                  <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                    !
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleResetFilters}>
                  <RotateCcw className="h-4 w-4" />
                  重置
                </Button>
              )}
              {someSelected && (
                <Button variant="destructive" size="sm" className="gap-2" onClick={() => setBatchDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  删除 ({selectedIds.size})
                </Button>
              )}
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                新增任务
              </Button>
            </div>
          </div>

          {/* 月份筛选 — 下拉选择 */}
          {showDateFilter && (
            <div className="mt-3 grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">创建月份</Label>
                <Select value={monthCreated || 'all'} onValueChange={v => { setMonthCreated(v === 'all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {monthOptions.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">完成月份</Label>
                <Select value={monthCompleted || 'all'} onValueChange={v => { setMonthCompleted(v === 'all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {monthOptions.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">结算月份</Label>
                <Select value={monthSettled || 'all'} onValueChange={v => { setMonthSettled(v === 'all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {monthOptions.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">要求完成月份</Label>
                <Select value={monthDueDate || 'all'} onValueChange={v => { setMonthDueDate(v === 'all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {monthOptions.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 数据统计条 */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>共 <strong className="text-foreground">{filtered.length}</strong> 条记录</span>
        <span>·</span>
        <span>垫付: <strong className="text-foreground">{formatMoney(filtered.reduce((s, t) => s + t.advanceAmount, 0))}</strong></span>
        <span>·</span>
        <span>稿费: <strong className="text-foreground">{formatMoney(filtered.reduce((s, t) => s + t.manuscriptFee, 0))}</strong></span>
        <span>·</span>
        <span>到手: <strong className="text-foreground">{formatMoney(filtered.reduce((s, t) => s + t.netAmount, 0))}</strong></span>
      </div>

      {/* 桌面端表格 */}
      <Card className="hidden border-border/60 lg:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="全选"
                    />
                  </TableHead>
                  <TableHead className="min-w-[120px]">任务名称</TableHead>
                  <TableHead>发布账号</TableHead>
                  <TableHead>合作方式</TableHead>
                  <TableHead className="text-right">垫付</TableHead>
                  <TableHead className="text-right">稿费</TableHead>
                  <TableHead className="text-right">商品</TableHead>
                  <TableHead className="text-right">返佣</TableHead>
                  <TableHead className="text-right">到手</TableHead>
                  <TableHead>完成度</TableHead>
                  <TableHead>创建日期</TableHead>
                  <TableHead>要求完成</TableHead>
                  <TableHead>完成日期</TableHead>
                  <TableHead>回款</TableHead>
                  <TableHead>结算</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                        暂无数据
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageData.map(task => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(task.id)}
                          onCheckedChange={() => toggleSelect(task.id)}
                          aria-label={`选择 ${task.taskName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate" title={task.taskName}>
                        {task.taskName}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{task.publishAccount}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.cooperationMethod}</Badge>
                      </TableCell>
                      <TableCell className={`text-right ${task.isAdvanceReimbursed && task.advanceAmount > 0 ? 'line-through text-amber-600/50' : 'text-amber-600'}`}>{formatMoney(task.advanceAmount)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatMoney(task.manuscriptFee)}</TableCell>
                      <TableCell className="text-right text-purple-600">{formatMoney(task.productAmount)}</TableCell>
                      <TableCell className="text-right">{task.commissionRate}%</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">{formatMoney(task.netAmount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${task.completionDegree >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${task.completionDegree}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{task.completionDegree}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{task.createdAt ? task.createdAt.slice(0, 10) : '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{task.dueDate || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{task.completionDate || '-'}</TableCell>
                      <TableCell>
                        {task.isAdvanceReimbursed ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            已回款
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            未回款
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.isSettled ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            已结算
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                            未结算
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="编辑" onClick={() => handleEdit(task)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="更多操作">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {task.completionDegree < 100 && (
                                <DropdownMenuItem onClick={() => handleComplete(task)}>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  完成任务
                                </DropdownMenuItem>
                              )}
                              {!task.isSettled && (
                                <DropdownMenuItem onClick={() => handleSettle(task)}>
                                  <Banknote className="h-4 w-4 text-amber-600" />
                                  结算
                                </DropdownMenuItem>
                              )}
                              {!task.isAdvanceReimbursed && (
                                <DropdownMenuItem onClick={() => handleReimburse(task)}>
                                  <Undo2 className="h-4 w-4 text-orange-600" />
                                  已回款
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem variant="destructive" onClick={() => setDeleteId(task.id)}>
                                <Trash2 className="h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 移动端卡片列表 */}
      <div className="space-y-3 lg:hidden">
        {pageData.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center gap-2 p-12 text-muted-foreground">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
              暂无数据
            </CardContent>
          </Card>
        ) : (
          pageData.map(task => (
            <Card key={task.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.has(task.id)}
                        onCheckedChange={() => toggleSelect(task.id)}
                        className="shrink-0"
                        aria-label={`选择 ${task.taskName}`}
                      />
                      <h3 className="truncate font-medium">{task.taskName}</h3>
                      <Badge variant="outline" className="shrink-0">{task.publishAccount}</Badge>
                      <Badge variant="outline" className="shrink-0">{task.cooperationMethod}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      <span>垫付: <span className={task.isAdvanceReimbursed && task.advanceAmount > 0 ? 'line-through text-amber-600/50' : 'text-amber-600'}>{formatMoney(task.advanceAmount)}</span></span>
                      <span>稿费: <span className="text-green-600">{formatMoney(task.manuscriptFee)}</span></span>
                      <span>商品: <span className="text-purple-600">{formatMoney(task.productAmount)}</span></span>
                      <span>到手: <span className="font-semibold text-emerald-600">{formatMoney(task.netAmount)}</span></span>
                      <span>完成: {task.completionDegree}%</span>
                      <span>结算: {task.isSettled ? '是' : '否'}</span>
                      <span>回款: {task.isAdvanceReimbursed ? '是' : '否'}</span>
                      <span>创建: {task.createdAt ? task.createdAt.slice(0, 10) : '-'}</span>
                      <span>要求完成: {task.dueDate || '-'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="编辑" onClick={() => handleEdit(task)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="更多操作">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {task.completionDegree < 100 && (
                          <DropdownMenuItem onClick={() => handleComplete(task)}>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            完成任务
                          </DropdownMenuItem>
                        )}
                        {!task.isSettled && (
                          <DropdownMenuItem onClick={() => handleSettle(task)}>
                            <Banknote className="h-4 w-4 text-amber-600" />
                            结算
                          </DropdownMenuItem>
                        )}
                        {!task.isAdvanceReimbursed && (
                          <DropdownMenuItem onClick={() => handleReimburse(task)}>
                            <Undo2 className="h-4 w-4 text-orange-600" />
                            已回款
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteId(task.id)}>
                          <Trash2 className="h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 表单弹窗 */}
      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initial={editing}
        cooperationMethods={config.cooperationMethods}
        cooperationRequirements={config.cooperationRequirements}
        publishAccounts={config.publishAccounts}
      />

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该任务吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认 */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 <strong>{selectedIds.size}</strong> 条任务吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除 {selectedIds.size} 条
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

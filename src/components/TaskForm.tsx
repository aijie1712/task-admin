import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Task } from '@/types';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Task, 'id' | 'updatedAt'>) => void;
  initial?: Task | null;
  cooperationMethods: string[];
  cooperationRequirements: string[];
  publishAccounts: string[];
}

interface FormData {
  taskName: string;
  publishAccount: string;
  advanceAmount: string;
  isAdvanceReimbursed: boolean;
  cooperationMethod: string;
  cooperationRequirements: string;
  customRequirement: string;
  productAmount: string;
  manuscriptFee: string;
  commissionRate: string;
  commissionAmount: string;
  handlingFeeRate: string;
  netAmount: string;
  dueDate: string;
  createdAt: string;
  requiredPosts: string;
  publishedPosts: string;
  completionDate: string;
  isSettled: boolean;
  settlementDate: string;
  isCommissioned: boolean;
  commissionDate: string;
  remarks: string;
}

const emptyForm: FormData = {
  taskName: '',
  publishAccount: '',
  advanceAmount: '',
  isAdvanceReimbursed: false,
  cooperationMethod: '',
  cooperationRequirements: '',
  customRequirement: '',
  productAmount: '',
  manuscriptFee: '',
  commissionRate: '',
  commissionAmount: '',
  handlingFeeRate: '10',
  netAmount: '',
  dueDate: '',
  createdAt: new Date().toISOString().slice(0, 10),
  requiredPosts: '',
  publishedPosts: '0',
  completionDate: '',
  isSettled: false,
  settlementDate: '',
  isCommissioned: false,
  commissionDate: '',
  remarks: '',
};

export default function TaskForm({
  open, onOpenChange, onSubmit, initial,
  cooperationMethods, cooperationRequirements, publishAccounts,
}: TaskFormProps) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initial) {
      setForm({
        taskName: initial.taskName,
        publishAccount: initial.publishAccount || '',
        advanceAmount: String(initial.advanceAmount || ''),
        isAdvanceReimbursed: initial.isAdvanceReimbursed ?? false,
        cooperationMethod: initial.cooperationMethod,
        cooperationRequirements: initial.cooperationRequirements || '',
        customRequirement: '',
        productAmount: String(initial.productAmount || ''),
        manuscriptFee: String(initial.manuscriptFee || ''),
        commissionRate: String(initial.commissionRate || ''),
        commissionAmount: String(initial.commissionAmount || ''),
        handlingFeeRate: String(initial.handlingFeeRate ?? 10),
        netAmount: String(initial.netAmount || ''),
        dueDate: initial.dueDate || '',
        createdAt: initial.createdAt || new Date().toISOString().slice(0, 10),
        requiredPosts: String(initial.requiredPosts || ''),
        publishedPosts: String(initial.publishedPosts ?? 0),
        completionDate: initial.completionDate || '',
        isSettled: initial.isSettled,
        settlementDate: initial.settlementDate || '',
        isCommissioned: initial.isCommissioned ?? false,
        commissionDate: initial.commissionDate || '',
        remarks: initial.remarks || '',
      });
    } else {
      setForm({ ...emptyForm, publishAccount: publishAccounts.length > 0 ? publishAccounts[0] : '' });
    }
    setErrors({});
  }, [initial, open]);

  // 新增时：根据垫付金额自动调整回款开关默认值
  // advanceAmount > 0 → 默认关（未回款），<=0 → 默认开（已回款/无需回款）
  useEffect(() => {
    if (initial) return; // 仅新增时生效
    const adv = parseFloat(form.advanceAmount) || 0;
    setForm(prev => ({
      ...prev,
      isAdvanceReimbursed: adv <= 0,
    }));
  }, [form.advanceAmount, initial]);

  // 自动计算到手金额 = 稿费金额 × (1 - 返佣比例/100 - 手续费比例/100)
  // 同时计算返佣金额 = 稿费金额 × 返佣比例 / 100
  const calcNetAmount = () => {
    const fee = parseFloat(form.manuscriptFee) || 0;
    const commRate = parseFloat(form.commissionRate) || 0;
    const handlingRate = parseFloat(form.handlingFeeRate) || 0;
    const net = fee * (1 - commRate / 100 - handlingRate / 100);
    const commAmount = fee * commRate / 100;
    setForm(prev => ({
      ...prev,
      netAmount: Math.max(0, net).toFixed(2),
      commissionAmount: Math.max(0, commAmount).toFixed(2),
    }));
  };

  const update = (key: keyof FormData, value: string | boolean | string[]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const addCustomRequirement = () => {
    const trimmed = form.customRequirement.trim();
    if (!trimmed) return;
    update('cooperationRequirements', trimmed);
    update('customRequirement', '');
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.taskName.trim()) errs.taskName = '请输入任务名称';
    if (!form.publishAccount) errs.publishAccount = '请选择发布账号';
    if (!form.cooperationMethod) errs.cooperationMethod = '请选择合作方式';
    if (form.requiredPosts !== '' && (parseInt(form.requiredPosts) < 1)) {
      errs.requiredPosts = '要求篇数需大于 0';
    }
    if (form.publishedPosts !== '' && (parseInt(form.publishedPosts) < 0)) {
      errs.publishedPosts = '已发布篇数不能为负数';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const num = (v: string) => v === '' ? 0 : parseFloat(v) || 0;
    const intNum = (v: string) => v === '' ? 0 : parseInt(v) || 0;
    const required = intNum(form.requiredPosts);
    const published = intNum(form.publishedPosts);
    const completionDegree = required > 0 ? Math.round((published / required) * 100) : 0;
    onSubmit({
      taskName: form.taskName.trim(),
      publishAccount: form.publishAccount,
      advanceAmount: num(form.advanceAmount),
      cooperationMethod: form.cooperationMethod,
      cooperationRequirements: form.cooperationRequirements,
      productAmount: num(form.productAmount),
      manuscriptFee: num(form.manuscriptFee),
      commissionRate: num(form.commissionRate),
      commissionAmount: num(form.commissionAmount),
      handlingFeeRate: num(form.handlingFeeRate),
      netAmount: num(form.netAmount),
      dueDate: form.dueDate || null,
      createdAt: form.createdAt,
      requiredPosts: required,
      publishedPosts: published,
      completionDegree,
      completionDate: form.completionDate || null,
      isSettled: form.isSettled,
      settlementDate: form.settlementDate || null,
      isCommissioned: form.isCommissioned,
      commissionDate: form.commissionDate || null,
      isAdvanceReimbursed: form.isAdvanceReimbursed,
      remarks: form.remarks,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? '编辑任务' : '新增任务'}</DialogTitle>
          <DialogDescription>
            {initial ? '修改任务信息' : '填写任务详细信息，带 * 为必填项'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          {/* 任务名称 */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-red-500">* 任务名称</Label>
            <Input
              value={form.taskName}
              onChange={e => update('taskName', e.target.value)}
              placeholder="请输入任务名称"
            />
            {errors.taskName && <p className="text-xs text-destructive">{errors.taskName}</p>}
          </div>

          {/* 发布账号 */}
          <div className="space-y-1.5">
            <Label className="text-red-500">* 发布账号</Label>
            <Select value={form.publishAccount} onValueChange={v => update('publishAccount', v)}>
              <SelectTrigger>
                <SelectValue placeholder="请选择发布账号" />
              </SelectTrigger>
              <SelectContent>
                {publishAccounts.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.publishAccount && <p className="text-xs text-destructive">{errors.publishAccount}</p>}
          </div>

          {/* 合作方式 */}
          <div className="space-y-1.5">
            <Label className="text-red-500">* 合作方式</Label>
            <Select value={form.cooperationMethod} onValueChange={v => update('cooperationMethod', v)}>
              <SelectTrigger>
                <SelectValue placeholder="请选择合作方式" />
              </SelectTrigger>
              <SelectContent>
                {cooperationMethods.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.cooperationMethod && <p className="text-xs text-destructive">{errors.cooperationMethod}</p>}
          </div>

          {/* 合作要求 — 单选下拉 */}
          <div className="space-y-1.5">
            <Label>合作要求</Label>
            <Select value={form.cooperationRequirements} onValueChange={v => update('cooperationRequirements', v)}>
              <SelectTrigger>
                <SelectValue placeholder="请选择合作要求" />
              </SelectTrigger>
              <SelectContent>
                {cooperationRequirements.map(req => (
                  <SelectItem key={req} value={req}>{req}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 pt-0.5">
              <Input
                value={form.customRequirement}
                onChange={e => update('customRequirement', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomRequirement(); } }}
                placeholder="自定义合作要求…"
                className="h-7 flex-1 !text-xs"
              />
              <Button type="button" variant="outline" size="sm" className="h-7 !text-xs" onClick={addCustomRequirement}>
                添加
              </Button>
            </div>
          </div>

          {/* 垫付金额 */}
          <div className="space-y-1.5">
            <Label>垫付金额 (¥)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.advanceAmount}
              onChange={e => update('advanceAmount', e.target.value)}
              placeholder="0.00"
              className={form.isAdvanceReimbursed && parseFloat(form.advanceAmount || '0') > 0 ? 'line-through text-muted-foreground' : ''}
            />
          </div>

          {/* 商品金额 */}
          <div className="space-y-1.5">
            <Label>商品金额 (¥)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.productAmount}
              onChange={e => update('productAmount', e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* 稿费金额 */}
          <div className="space-y-1.5">
            <Label>稿费金额 (¥)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.manuscriptFee}
              onChange={e => update('manuscriptFee', e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* 返佣比例 */}
          <div className="space-y-1.5">
            <Label>返佣比例 (%)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.commissionRate}
              onChange={e => update('commissionRate', e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* 返佣金额 — 自动计算 */}
          <div className="space-y-1.5">
            <Label>返佣金额 (¥)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                value={form.commissionAmount}
                onChange={e => update('commissionAmount', e.target.value)}
                placeholder="0.00"
              />
              <Button type="button" variant="outline" size="sm" onClick={calcNetAmount}>
                自动计算
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">= 稿费 × 返佣比例 / 100</p>
          </div>

          {/* 手续费比例 */}
          <div className="space-y-1.5">
            <Label>手续费比例 (%)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.handlingFeeRate}
              onChange={e => update('handlingFeeRate', e.target.value)}
              placeholder="10.00"
            />
          </div>

          {/* 到手金额 */}
          <div className="space-y-1.5">
            <Label>到手金额 (¥)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                value={form.netAmount}
                onChange={e => update('netAmount', e.target.value)}
                placeholder="0.00"
              />
              <Button type="button" variant="outline" size="sm" onClick={calcNetAmount}>
                自动计算
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">= 稿费 × (1 - 返佣比例 - 手续费比例)</p>
          </div>

          {/* 要求发布篇数 */}
          <div className="space-y-1.5">
            <Label>要求发布篇数</Label>
            <Input
              type="number"
              min="0"
              value={form.requiredPosts}
              onChange={e => update('requiredPosts', e.target.value)}
              placeholder="0"
            />
            {errors.requiredPosts && <p className="text-xs text-destructive">{errors.requiredPosts}</p>}
          </div>

          {/* 已发布篇数 */}
          <div className="space-y-1.5">
            <Label>已发布篇数</Label>
            <Input
              type="number"
              min="0"
              value={form.publishedPosts}
              onChange={e => update('publishedPosts', e.target.value)}
              placeholder="0"
            />
            {errors.publishedPosts && <p className="text-xs text-destructive">{errors.publishedPosts}</p>}
          </div>

          {/* 要求完成时间 */}
          <div className="space-y-1.5">
            <Label>要求完成时间</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={e => update('dueDate', e.target.value)}
            />
          </div>

          {/* 创建日期 */}
          <div className="space-y-1.5">
            <Label>创建日期</Label>
            <Input
              type="date"
              value={form.createdAt}
              onChange={e => update('createdAt', e.target.value)}
            />
          </div>

          {/* 完成度 — 自动计算，只读 */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>完成度</Label>
            <div className="flex items-center gap-3 h-9 px-3 rounded-md border bg-muted/50">
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                {(() => {
                  const req = parseInt(form.requiredPosts) || 0;
                  const pub = parseInt(form.publishedPosts) || 0;
                  const deg = req > 0 ? Math.min(100, Math.round((pub / req) * 100)) : 0;
                  return (
                    <div
                      className={`h-full rounded-full transition-all ${deg >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${deg}%` }}
                    />
                  );
                })()}
              </div>
              <span className="text-sm font-medium tabular-nums shrink-0">
                {(() => {
                  const req = parseInt(form.requiredPosts) || 0;
                  const pub = parseInt(form.publishedPosts) || 0;
                  return req > 0 ? `${Math.min(100, Math.round((pub / req) * 100))}%` : '-';
                })()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">= 已发布篇数 / 要求发布篇数 × 100%</p>
          </div>

          {/* 完成日期 */}
          <div className="space-y-1.5">
            <Label>完成日期</Label>
            <Input
              type="date"
              value={form.completionDate}
              onChange={e => update('completionDate', e.target.value)}
            />
          </div>

          {/* 垫付是否回款 — 单独一行 */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>垫付回款</Label>
            <div className="flex items-center gap-2 h-9">
              <Switch
                className="data-[state=checked]:!bg-[#6E7DF7]"
                checked={form.isAdvanceReimbursed}
                onCheckedChange={v => update('isAdvanceReimbursed', v)}
              />
              <span className="text-sm">{form.isAdvanceReimbursed ? '已回款' : '未回款'}</span>
            </div>
          </div>

          {/* 是否结算 + 结算日期 — 同行 */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>结算信息</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  className="data-[state=checked]:!bg-[#6E7DF7]"
                  checked={form.isSettled}
                  onCheckedChange={v => {
                    update('isSettled', v);
                    if (v && !form.settlementDate) {
                      const today = new Date().toISOString().slice(0, 10);
                      setForm(prev => ({ ...prev, settlementDate: today }));
                    }
                  }}
                />
                <span className="text-sm">{form.isSettled ? '已结算' : '未结算'}</span>
              </div>
              <div className="flex-1">
                <Input
                  type="date"
                  value={form.settlementDate}
                  onChange={e => update('settlementDate', e.target.value)}
                  disabled={!form.isSettled}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* 是否返佣 + 返佣日期 — 同行 */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>返佣信息</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  className="data-[state=checked]:!bg-[#6E7DF7]"
                  checked={form.isCommissioned}
                  onCheckedChange={v => {
                    update('isCommissioned', v);
                    if (v && !form.commissionDate) {
                      const today = new Date().toISOString().slice(0, 10);
                      setForm(prev => ({ ...prev, commissionDate: today }));
                    }
                  }}
                />
                <span className="text-sm">{form.isCommissioned ? '已返佣' : '未返佣'}</span>
              </div>
              <div className="flex-1">
                <Input
                  type="date"
                  value={form.commissionDate}
                  onChange={e => update('commissionDate', e.target.value)}
                  disabled={!form.isCommissioned}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>备注</Label>
            <Textarea
              value={form.remarks}
              onChange={e => update('remarks', e.target.value)}
              placeholder="填写备注信息"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit}>{initial ? '保存修改' : '添加任务'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

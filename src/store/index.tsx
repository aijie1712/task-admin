import { useCallback, useEffect, useState, createContext, useContext } from 'react';
import type { Task, SystemConfig, AccountInfo, CurrentUser } from '@/types';
import { supabase, sha256 } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

// ========== Auth 持久化 ==========
const AUTH_KEY = 'task_admin_auth';

function saveAuth(user: CurrentUser & { userId: string }) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function loadAuth(): (CurrentUser & { userId: string }) | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

// ========== 默认配置 ==========
export const DEFAULT_CONFIG: SystemConfig = {
  cooperationMethods: ['报备', '置换', '包月', '寄拍', '纯佣', '专场'],
  cooperationRequirements: [
    '图文发布', '视频发布', '直播带货', '小红书种草',
    '抖音推广', '淘宝挂车', '微信推文', '微博转发',
  ],
  publishAccounts: ['小红书-主号', '抖音-主号', '微博-主号', 'B站-主号'],
};

/** 将 Supabase 行转为 Task 类型 */
function rowToTask(row: Database['public']['Tables']['tasks']['Row']): Task {
  return {
    id: row.id as string,
    taskName: (row.task_name as string) || '',
    publishAccount: (row.publish_account as string) || '',
    advanceAmount: Number(row.advance_amount) || 0,
    cooperationMethod: (row.cooperation_method as string) || '',
    cooperationRequirements: (row.cooperation_requirements as string) || '',
    productAmount: Number(row.product_amount) || 0,
    manuscriptFee: Number(row.manuscript_fee) || 0,
    commissionRate: Number(row.commission_rate) || 0,
    commissionAmount: Number(row.commission_amount) || 0,
    handlingFeeRate: Number(row.handling_fee_rate) ?? 10,
    netAmount: Number(row.net_amount) || 0,
    dueDate: (row.due_date as string) || '',
    requiredPosts: Number(row.required_posts) || 0,
    publishedPosts: Number(row.published_posts) || 0,
    completionDegree: Number(row.completion_degree) || 0,
    completionDate: (row.completion_date as string) || null,
    isSettled: Boolean(row.is_settled),
    settlementDate: (row.settlement_date as string) || null,
    isCommissioned: Boolean(row.is_commissioned),
    commissionDate: (row.commission_date as string) || null,
    isAdvanceReimbursed: Boolean(row.is_advance_reimbursed),
    remarks: (row.remarks as string) || '',
    createdAt: (row.created_at as string) || '',
    updatedAt: (row.updated_at as string) || '',
  };
}

/** 将 Task 转为 Supabase 插入/更新格式 */
function taskToRow(data: Partial<Task> & { user_id?: string }): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.user_id !== undefined) row.user_id = data.user_id;
  if (data.taskName !== undefined) row.task_name = data.taskName;
  if (data.publishAccount !== undefined) row.publish_account = data.publishAccount;
  if (data.advanceAmount !== undefined) row.advance_amount = data.advanceAmount;
  if (data.cooperationMethod !== undefined) row.cooperation_method = data.cooperationMethod;
  if (data.cooperationRequirements !== undefined) row.cooperation_requirements = data.cooperationRequirements;
  if (data.productAmount !== undefined) row.product_amount = data.productAmount;
  if (data.manuscriptFee !== undefined) row.manuscript_fee = data.manuscriptFee;
  if (data.commissionRate !== undefined) row.commission_rate = data.commissionRate;
  if (data.commissionAmount !== undefined) row.commission_amount = data.commissionAmount;
  if (data.handlingFeeRate !== undefined) row.handling_fee_rate = data.handlingFeeRate;
  if (data.netAmount !== undefined) row.net_amount = data.netAmount;
  if (data.dueDate !== undefined) row.due_date = data.dueDate;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.requiredPosts !== undefined) row.required_posts = data.requiredPosts;
  if (data.publishedPosts !== undefined) row.published_posts = data.publishedPosts;
  if (data.completionDegree !== undefined) row.completion_degree = data.completionDegree;
  if (data.completionDate !== undefined) row.completion_date = data.completionDate;
  if (data.isSettled !== undefined) row.is_settled = data.isSettled;
  if (data.settlementDate !== undefined) row.settlement_date = data.settlementDate;
  if (data.isCommissioned !== undefined) row.is_commissioned = data.isCommissioned;
  if (data.commissionDate !== undefined) row.commission_date = data.commissionDate;
  if (data.isAdvanceReimbursed !== undefined) row.is_advance_reimbursed = data.isAdvanceReimbursed;
  if (data.remarks !== undefined) row.remarks = data.remarks;
  row.updated_at = new Date().toISOString();
  return row;
}

// ========== Auth Context ==========
interface AuthContextValue {
  user: (CurrentUser & { userId: string }) | null;
  login: (username: string, password: string) => Promise<{ success: boolean; user?: CurrentUser & { userId: string } }>;
  logout: () => void;
}

const AuthCtx = createContext<AuthContextValue>({
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(CurrentUser & { userId: string }) | null>(loadAuth);

  const login = async (username: string, password: string) => {
    const hash = await sha256(password);
    const { data, error } = await supabase
      .from('accounts')
      .select('id, username, is_admin, password_hash')
      .eq('username', username)
      .eq('password_hash', hash)
      .maybeSingle();

    if (error || !data) return { success: false };

    const userData = { username: data.username, isAdmin: data.is_admin, userId: data.id as string };
    saveAuth(userData);
    setUser(userData);
    return { success: true, user: userData };
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useCurrentUser() {
  return useContext(AuthCtx);
}

// ========== Tasks Hook ==========
export function useTasks() {
  const { user } = useContext(AuthCtx);
  const userId = user?.userId ?? '';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // 初次加载任务
  useEffect(() => {
    if (!userId) { setTasks([]); setLoading(false); return; }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (!error && data) {
        setTasks(data.map(rowToTask));
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [userId, user?.isAdmin]);

  const addTask = useCallback(async (data: Omit<Task, 'id' | 'updatedAt'>) => {
    const { error } = await supabase.from('tasks').insert({ ...taskToRow(data), user_id: userId } as Database['public']['Tables']['tasks']['Insert']);
    if (error) throw error;
    // 重新拉取列表
    const { data: refetched } = await supabase
      .from('tasks').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (refetched) setTasks(refetched.map(rowToTask));
  }, [userId]);

  const updateTask = useCallback(async (id: string, data: Partial<Omit<Task, 'id'>>) => {
    const { error } = await supabase.from('tasks').update(taskToRow(data) as Database['public']['Tables']['tasks']['Update']).eq('id', id);
    if (error) throw error;
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
    ));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const deleteTasks = useCallback(async (ids: string[]) => {
    const { error } = await supabase.from('tasks').delete().in('id', ids);
    if (error) throw error;
    const idSet = new Set(ids);
    setTasks(prev => prev.filter(t => !idSet.has(t.id)));
  }, []);

  const getTask = useCallback((id: string) => {
    return tasks.find(t => t.id === id);
  }, [tasks]);

  return { tasks, loading, addTask, updateTask, deleteTask, deleteTasks, getTask };
}

// ========== Config Hook ==========
export function useConfig() {
  const { user } = useContext(AuthCtx);
  const userId = user?.userId ?? '';
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [configId, setConfigId] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // 加载配置
  useEffect(() => {
    if (!userId) { setConfigLoading(false); return; }
    const load = async () => {
      const { data, error } = await supabase
        .from('configs')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) { setConfigLoading(false); return; }
      if (data) {
        setConfigId(data.id as string);
        setConfig({
          cooperationMethods: (data.cooperation_methods as string[]) || DEFAULT_CONFIG.cooperationMethods,
          cooperationRequirements: (data.cooperation_requirements as string[]) || DEFAULT_CONFIG.cooperationRequirements,
          publishAccounts: (data.publish_accounts as string[]) || DEFAULT_CONFIG.publishAccounts,
        });
      }
      setConfigLoading(false);
    };
    load();
  }, [userId]);

  const updateConfig = useCallback(async (data: Partial<SystemConfig>) => {
    const newConfig = { ...config, ...data };
    setConfig(newConfig);

    const row = {
      user_id: userId,
      cooperation_methods: newConfig.cooperationMethods,
      cooperation_requirements: newConfig.cooperationRequirements,
      publish_accounts: newConfig.publishAccounts,
      updated_at: new Date().toISOString(),
    };

    if (configId) {
      await supabase.from('configs').update(row as Database['public']['Tables']['configs']['Update']).eq('id', configId);
    } else {
      const { data: inserted } = await supabase.from('configs').insert(row as Database['public']['Tables']['configs']['Insert']).select('id').single();
      if (inserted) setConfigId(inserted.id as string);
    }
  }, [userId, config, configId]);

  return { config, updateConfig, configLoading };
}

// ========== Accounts Hook（管理员用） ==========
export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('accounts').select('username, is_admin').order('created_at');
      if (data) {
        setAccounts((data as Record<string, unknown>[]).map(row => ({
          username: row.username as string,
          isAdmin: Boolean(row.is_admin),
        })) as AccountInfo[]);
      }
    };
    load();
  }, []);

  const addAccount = useCallback(async (info: AccountInfo) => {
    const hash = await sha256(info.password);
    const { error } = await supabase.from('accounts').insert({
      username: info.username,
      password_hash: hash,
      is_admin: info.isAdmin,
    } as Database['public']['Tables']['accounts']['Insert']);
    if (error) throw error;

    // 新账号自动创建配置
    const { data: newAcc } = await supabase.from('accounts').select('id').eq('username', info.username).single();
    if (newAcc) {
      await supabase.from('configs').insert({ user_id: newAcc.id });
    }

    setAccounts(prev => [...prev, info]);
  }, []);

  const removeAccount = useCallback(async (username: string) => {
    // 先获取用户ID来删除关联数据
    const { data: acc } = await supabase.from('accounts').select('id').eq('username', username).single();
    if (acc) {
      await supabase.from('tasks').delete().eq('user_id', acc.id);
      await supabase.from('configs').delete().eq('user_id', acc.id);
    }
    await supabase.from('accounts').delete().eq('username', username);
    setAccounts(prev => prev.filter(a => a.username !== username));
  }, []);

  return { accounts, addAccount, removeAccount };
}

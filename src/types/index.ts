// 任务数据类型定义

export interface Task {
  id: string;
  taskName: string;
  publishAccount: string; // 发布账号
  advanceAmount: number; // 垫付金额
  cooperationMethod: string; // 合作方式
  cooperationRequirements: string; // 合作要求（单选）
  productAmount: number; // 商品金额
  manuscriptFee: number; // 稿费金额
  commissionRate: number; // 返佣比例 (%)
  commissionAmount: number; // 返佣金额 = 稿费 × 返佣比例 / 100
  handlingFeeRate: number; // 手续费比例 (%)，默认10%
  netAmount: number; // 到手金额
  dueDate: string | null; // 要求完成时间
  requiredPosts: number; // 要求发布篇数
  publishedPosts: number; // 已发布篇数
  completionDegree: number; // 完成度 (%) = publishedPosts / requiredPosts * 100
  completionDate: string | null; // 完成日期
  isSettled: boolean; // 是否结算
  settlementDate: string | null; // 结算日期
  isCommissioned: boolean; // 是否返佣
  commissionDate: string | null; // 返佣日期
  isAdvanceReimbursed: boolean; // 垫付是否已回款
  remarks: string; // 备注
  createdAt: string;
  updatedAt: string;
}

// 系统配置
export interface SystemConfig {
  cooperationMethods: string[]; // 合作方式选项
  cooperationRequirements: string[]; // 合作要求选项
  publishAccounts: string[]; // 发布账号选项
}

// 系统账号
export interface AccountInfo {
  username: string;
  password: string;
  isAdmin: boolean;
}

// 当前登录用户
export interface CurrentUser {
  username: string;
  isAdmin: boolean;
}

// 统计维度
export type StatDimension = 'manuscriptFee' | 'productAmount' | 'netAmount' | 'taskName';
export type StatTimeField = 'completionDate' | 'settlementDate';
export type StatPeriod = 'monthly' | 'yearly';

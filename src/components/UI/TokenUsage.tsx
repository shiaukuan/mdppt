'use client';

import React, { useMemo } from 'react';
import { clsx } from 'clsx';
import type { TokenUsage } from '@/hooks/useSlideGeneration';

export interface TokenUsageProps {
  /** Token 使用資料 */
  usage: TokenUsage;
  /** 顯示模式 */
  mode?: 'compact' | 'detailed' | 'minimal';
  /** 是否顯示成本 */
  showCost?: boolean;
  /** 是否顯示會話統計 */
  showSession?: boolean;
  /** 自定義樣式類名 */
  className?: string;
  /** 是否可點擊（顯示詳細資訊） */
  clickable?: boolean;
  /** 點擊回調 */
  onClick?: () => void;
}

const TokenUsage: React.FC<TokenUsageProps> = ({
  usage,
  mode = 'detailed',
  showCost = true,
  showSession = true,
  className,
  clickable = false,
  onClick,
}) => {
  // 格式化數字
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // 格式化成本
  const formatCost = (cost: number): string => {
    if (cost < 0.001) {
      return '< $0.001';
    }
    if (cost < 0.01) {
      return `$${cost.toFixed(4)}`;
    }
    if (cost < 1) {
      return `$${cost.toFixed(3)}`;
    }
    return `$${cost.toFixed(2)}`;
  };

  // 計算會話總成本（簡化估算）
  const sessionCost = useMemo(() => {
    // 假設平均每個 token 的成本
    const avgCostPerToken = usage.estimatedCost / Math.max(usage.totalTokens, 1);
    return usage.sessionTotal * avgCostPerToken;
  }, [usage]);

  // 效率評分（基於 completion vs prompt tokens 比例）
  const efficiencyScore = useMemo(() => {
    if (usage.promptTokens === 0) return 0;
    const ratio = usage.completionTokens / usage.promptTokens;
    // 理想比例約為 2:1 到 4:1
    if (ratio >= 2 && ratio <= 4) return 100;
    if (ratio >= 1 && ratio <= 6) return 80;
    if (ratio >= 0.5 && ratio <= 8) return 60;
    return 40;
  }, [usage.promptTokens, usage.completionTokens]);

  // 最小模式
  if (mode === 'minimal') {
    return (
      <div className={clsx('text-xs text-gray-500 dark:text-gray-400', className)}>
        {formatNumber(usage.totalTokens)} tokens
        {showCost && usage.estimatedCost > 0 && (
          <span className="ml-1">({formatCost(usage.estimatedCost)})</span>
        )}
      </div>
    );
  }

  // 緊湊模式
  if (mode === 'compact') {
    return (
      <div
        className={clsx(
          'flex items-center space-x-2 text-sm',
          clickable && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-2',
          className
        )}
        onClick={clickable ? onClick : undefined}
      >
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">{formatNumber(usage.totalTokens)}</span>
        </div>
        
        {showCost && usage.estimatedCost > 0 && (
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-gray-600 dark:text-gray-300">{formatCost(usage.estimatedCost)}</span>
          </div>
        )}
      </div>
    );
  }

  // 詳細模式
  return (
    <div
      className={clsx(
        'bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3',
        clickable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Token 使用統計
        </h3>
        {efficiencyScore > 0 && (
          <div className="flex items-center space-x-1">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              {
                'bg-green-500': efficiencyScore >= 80,
                'bg-yellow-500': efficiencyScore >= 60,
                'bg-red-500': efficiencyScore < 60,
              }
            )} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              效率 {efficiencyScore}%
            </span>
          </div>
        )}
      </div>

      {/* Token 統計 */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {formatNumber(usage.promptTokens)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">輸入</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {formatNumber(usage.completionTokens)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">輸出</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            {formatNumber(usage.totalTokens)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">總計</div>
        </div>
      </div>

      {/* 進度條 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>輸入 vs 輸出比例</span>
          <span>{((usage.completionTokens / Math.max(usage.promptTokens, 1)) * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, (usage.completionTokens / Math.max(usage.totalTokens, 1)) * 100)}%`
            }}
          />
        </div>
      </div>

      {/* 成本資訊 */}
      {showCost && usage.estimatedCost > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-300">估計成本</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCost(usage.estimatedCost)}
          </span>
        </div>
      )}

      {/* 會話統計 */}
      {showSession && usage.requestCount > 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">本次會話</span>
            <span className="text-gray-900 dark:text-gray-100">
              {usage.requestCount} 次請求
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">總 Tokens</span>
            <span className="text-gray-900 dark:text-gray-100">
              {formatNumber(usage.sessionTotal)}
            </span>
          </div>
          {showCost && sessionCost > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">會話成本</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCost(sessionCost)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenUsage;

// 簡化的 Token 計數器組件
export const TokenCounter: React.FC<{
  count: number;
  label?: string;
  className?: string;
}> = ({ count, label = 'tokens', className }) => (
  <div className={clsx('flex items-center space-x-1 text-sm', className)}>
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
    <span className="font-medium">{count.toLocaleString()}</span>
    <span className="text-gray-500">{label}</span>
  </div>
);

// 成本估算組件
export const CostEstimate: React.FC<{
  cost: number;
  className?: string;
  showIcon?: boolean;
}> = ({ cost, className, showIcon = true }) => (
  <div className={clsx('flex items-center space-x-1 text-sm', className)}>
    {showIcon && (
      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    )}
    <span className="font-medium text-gray-900 dark:text-gray-100">
      {cost < 0.001 ? '< $0.001' : `$${cost.toFixed(cost < 0.01 ? 4 : cost < 1 ? 3 : 2)}`}
    </span>
  </div>
);
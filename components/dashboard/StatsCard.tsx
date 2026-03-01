'use client';

/**
 * Stats Card Component
 * Displays a single statistic with icon and trend
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  className 
}: StatsCardProps) {
  return (
    <div className={cn(
      'bg-gray-900 rounded-xl border border-gray-800 p-6',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center mt-2 text-sm',
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            )}>
              <svg 
                className={cn('w-4 h-4 mr-1', !trend.isPositive && 'rotate-180')}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {trend.value}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-gray-800 rounded-lg text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

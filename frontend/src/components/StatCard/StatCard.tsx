import React from 'react';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import styles from './StatCard.module.css';

export type StatColor = 'blue' | 'gold' | 'green' | 'red' | 'purple' | 'teal' | 'orange';

export interface StatCardProps {
    title: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    color?: StatColor;
    trend?: { value: number; direction: 'up' | 'down' };
    // label to render immediately after the trend value (e.g. "vs last month")
    trendLabel?: string;
    note?: React.ReactNode;
    suffix?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    align?: 'center' | 'left';
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    color = 'blue',
    trend,
    trendLabel,
    note,
    suffix,
    iconPosition = 'left',
    align = 'center'
}) => {
    return (
        <div className={styles.card} data-align={align} data-iconpos={iconPosition}>
            {icon && (
                <div
                    className={`${styles.iconCircle} ${styles[`color_${color}`]}`}
                    aria-hidden
                >
                    {icon}
                </div>
            )}

            <div className={styles.body}>
                <div className={styles.title}>{title}</div>
                <div className={styles.value}>
                    {value}
                    {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
                </div>

                {trend ? (
                    <div className={`${styles.trend} ${trend.direction === 'up' ? styles.up : styles.down}`}>
                        {trend.direction === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        <span className={styles.trendValue}>{Math.abs(Number(trend.value)).toFixed(1)}%</span>
                        {trendLabel ? <span className={styles.trendLabel}> {trendLabel}</span> : null}
                    </div>
                ) : null}

                {/* Only render note when there's no trendLabel (to avoid duplication) */}
                {(!trendLabel && note) ? <div className={styles.note}>{note}</div> : null}
            </div>
        </div>
    );
};

export default StatCard;

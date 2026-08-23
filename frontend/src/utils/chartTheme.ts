export type Theme = 'light' | 'dark';

export interface ChartThemeConfig {
  gridStroke: string;
  axisColor: string;
  axisTickColor: string;
  axisStroke: string;
  axisTickText: string;
  categoryTickText: string;
  pieStroke: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  tooltipMutedText: string;
  tooltipShadow: string;
  radarGrid: string;
  radarFill: string;
  radarStroke: string;
  cursorFill: string;
  polarAngleColor: string;
  polarRadiusColor: string;
}

export const lightChartTheme: ChartThemeConfig = {
  gridStroke: 'rgba(226, 232, 240, 0.8)',
  axisColor: '#94A3B8',
  axisTickColor: '#64748B',
  axisStroke: 'rgba(203, 213, 225, 0.6)',
  axisTickText: '#64748B',
  categoryTickText: '#334155',
  pieStroke: 'rgba(248, 250, 252, 0.9)',
  tooltipBg: 'rgba(255, 255, 255, 0.95)',
  tooltipBorder: 'rgba(226, 232, 240, 0.9)',
  tooltipText: '#0F172A',
  tooltipMutedText: '#64748B',
  tooltipShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
  radarGrid: 'rgba(203, 213, 225, 0.8)',
  radarFill: 'rgba(99, 102, 241, 0.25)',
  radarStroke: '#6366F1',
  cursorFill: 'rgba(99, 102, 241, 0.08)',
  polarAngleColor: '#475569',
  polarRadiusColor: '#94A3B8',
};

export const darkChartTheme: ChartThemeConfig = {
  gridStroke: 'rgba(255, 255, 255, 0.08)',
  axisColor: '#475569',
  axisTickColor: '#94A3B8',
  axisStroke: 'rgba(255, 255, 255, 0.1)',
  axisTickText: '#94A3B8',
  categoryTickText: '#CBD5E1',
  pieStroke: 'rgba(15, 23, 42, 0.8)',
  tooltipBg: 'rgba(15, 23, 42, 0.92)',
  tooltipBorder: 'rgba(255, 255, 255, 0.12)',
  tooltipText: '#F8FAFC',
  tooltipMutedText: '#94A3B8',
  tooltipShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)',
  radarGrid: 'rgba(255, 255, 255, 0.12)',
  radarFill: 'rgba(99, 102, 241, 0.35)',
  radarStroke: '#818CF8',
  cursorFill: 'rgba(255, 255, 255, 0.04)',
  polarAngleColor: '#CBD5E1',
  polarRadiusColor: '#64748B',
};

export function getChartTheme(theme: Theme = 'dark'): ChartThemeConfig {
  return theme === 'light' ? lightChartTheme : darkChartTheme;
}

export function getChartTooltipStyle(theme: Theme = 'dark') {
  const config = getChartTheme(theme);
  return {
    backgroundColor: config.tooltipBg,
    borderColor: config.tooltipBorder,
    color: config.tooltipText,
    borderRadius: '12px',
    boxShadow: config.tooltipShadow,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderWidth: '1px',
    padding: '10px 14px',
    fontSize: '12px',
  };
}

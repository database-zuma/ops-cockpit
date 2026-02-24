export const colors = {
  panel: { bg: '#0a0a0f', border: '#1a1a2e' },
  accent: { primary: '#00ffcc', secondary: '#3366ff' },
  rag: {
    critical: '#ff3333',
    warning: '#ff9933',
    caution: '#ffcc00',
    normal: '#33ff99',
    info: '#33ccff',
  },
  text: { primary: '#e2e8f0', secondary: '#94a3b8', muted: '#475569' },
  surface: { '100': '#0f0f1a', '200': '#1a1a2e', '300': '#252540' },
} as const;

export type RagStatus = 'critical' | 'warning' | 'caution' | 'normal' | 'info';

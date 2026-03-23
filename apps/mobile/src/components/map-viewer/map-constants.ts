export const MARKER_SIZES = { sm: 16, md: 24, lg: 32, xl: 48 } as const;

export type MapMode = 'select' | 'add-comment' | 'draw-path' | 'add-list-item';

export const REACTION_EMOJIS = ['thumbs_up', 'thumbs_down', 'heart', 'laugh', 'fire', 'eyes'] as const;

export const REACTION_DISPLAY: Record<string, string> = {
  thumbs_up: '\u{1F44D}',
  thumbs_down: '\u{1F44E}',
  heart: '\u2764\uFE0F',
  laugh: '\u{1F602}',
  fire: '\u{1F525}',
  eyes: '\u{1F440}',
};

export const PATH_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316',
] as const;

export const LIST_ITEM_STATUS_COLORS: Record<string, string> = {
  pending: '#9CA3AF',
  in_progress: '#F59E0B',
  completed: '#10B981',
};

export const SHAPE_PATHS: Record<string, (size: number) => string> = {
  circle: () => '',
  square: (s) => `M${-s / 2},${-s / 2} h${s} v${s} h${-s}Z`,
  triangle: (s) => `M0,${-s / 2} L${s / 2},${s / 2} L${-s / 2},${s / 2}Z`,
  diamond: (s) => `M0,${-s / 2} L${s / 2},0 L0,${s / 2} L${-s / 2},0Z`,
};

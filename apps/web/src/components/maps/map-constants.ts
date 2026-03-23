export const MARKER_SIZES = { sm: 16, md: 24, lg: 32, xl: 48 } as const

export type MapMode = 'select' | 'add-comment' | 'draw-path' | 'add-list-item'

export const REACTION_EMOJIS = ['thumbs_up', 'thumbs_down', 'heart', 'laugh', 'fire', 'eyes'] as const

export const REACTION_DISPLAY: Record<string, string> = {
  thumbs_up: '👍',
  thumbs_down: '👎',
  heart: '❤️',
  laugh: '😂',
  fire: '🔥',
  eyes: '👀',
}

export const PATH_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316',
] as const

export const PATH_WIDTHS = [2, 4, 6, 8, 12, 16] as const
export const DEFAULT_PATH_WIDTH = 4

export const LIST_ITEM_STATUS_COLORS: Record<string, string> = {
  pending: '#9CA3AF',
  in_progress: '#F59E0B',
  completed: '#10B981',
}

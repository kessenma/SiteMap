import { REACTION_EMOJIS, REACTION_DISPLAY } from './map-constants'

type ReactionCount = {
  emoji: string
  count: number
  hasReacted: boolean
}

export function CommentReactions({
  reactions,
  onToggle,
}: {
  reactions: ReactionCount[]
  onToggle: (emoji: string) => void
}) {
  const reactionMap = new Map(reactions.map((r) => [r.emoji, r]))

  return (
    <div className="flex flex-wrap gap-1">
      {REACTION_EMOJIS.map((emoji) => {
        const r = reactionMap.get(emoji)
        const count = r?.count ?? 0
        const hasReacted = r?.hasReacted ?? false

        return (
          <button
            key={emoji}
            type="button"
            className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors hover:bg-muted"
            style={{
              borderColor: hasReacted ? '#3B82F6' : '#e5e7eb',
              backgroundColor: hasReacted ? '#EFF6FF' : 'transparent',
            }}
            onClick={() => onToggle(emoji)}
          >
            <span>{REACTION_DISPLAY[emoji]}</span>
            {count > 0 && <span className="text-muted-foreground">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

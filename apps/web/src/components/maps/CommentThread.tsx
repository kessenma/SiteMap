import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { CheckCircle2, RotateCcw, ImagePlus, Send } from 'lucide-react'
import { CommentReactions } from './CommentReactions'

type Reply = {
  id: string
  content: string
  createdBy: string | null
  createdAt: string | Date
}

type ReactionCount = {
  emoji: string
  count: number
  hasReacted: boolean
}

type Photo = {
  id: string
  fileUri: string
  fileName: string
}

type Comment = {
  id: string
  x: number
  y: number
  content: string
  createdBy: string | null
  resolvedAt: string | Date | null
  createdAt: string | Date
  replies: Reply[]
  reactions: ReactionCount[]
  photos: Photo[]
}

export function CommentThread({
  comment,
  onReply,
  onToggleReaction,
  onResolve,
  onReopen,
  onAddPhoto,
}: {
  comment: Comment
  onReply: (commentId: string, content: string) => void
  onToggleReaction: (commentId: string, emoji: string) => void
  onResolve: (commentId: string) => void
  onReopen: (commentId: string) => void
  onAddPhoto: (commentId: string, file: File) => void
}) {
  const [replyText, setReplyText] = useState('')
  const isResolved = !!comment.resolvedAt

  const handleReply = () => {
    if (!replyText.trim()) return
    onReply(comment.id, replyText.trim())
    setReplyText('')
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm">{comment.content}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(comment.createdAt).toLocaleDateString()}
          </p>
        </div>
        {isResolved ? (
          <Badge variant="secondary" className="shrink-0">Resolved</Badge>
        ) : (
          <Badge variant="default" className="shrink-0">Open</Badge>
        )}
      </div>

      {/* Photos */}
      {comment.photos.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {comment.photos.map((photo) => (
            <img
              key={photo.id}
              src={`/api/files?path=${encodeURIComponent(photo.fileUri)}`}
              alt={photo.fileName}
              className="h-16 w-16 rounded border border-border object-cover cursor-pointer hover:opacity-80"
            />
          ))}
        </div>
      )}

      {/* Reactions */}
      <CommentReactions
        reactions={comment.reactions}
        onToggle={(emoji) => onToggleReaction(comment.id, emoji)}
      />

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-2 border-l-2 border-border pl-3">
          {comment.replies.map((reply) => (
            <div key={reply.id}>
              <p className="text-sm">{reply.content}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(reply.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5">
        <Input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Reply..."
          className="h-7 text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleReply()
          }}
        />
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleReply}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex gap-1.5">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onAddPhoto(comment.id, file)
            }}
          />
          <span className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer">
            <ImagePlus className="h-3 w-3" /> Photo
          </span>
        </label>

        {isResolved ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 ml-auto"
            onClick={() => onReopen(comment.id)}
          >
            <RotateCcw className="h-3 w-3" /> Reopen
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 ml-auto"
            onClick={() => onResolve(comment.id)}
          >
            <CheckCircle2 className="h-3 w-3" /> Resolve
          </Button>
        )}
      </div>
    </div>
  )
}

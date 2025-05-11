import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '../lib/platform-config'
import type { Draft } from '../types'
import { UIIcon } from './SocialIcons'

interface DraftsListProps {
  drafts: Draft[]
  onLoadDraft: (draftId: number) => void
  onDeleteDraft: (draftId: number) => void
}

export function DraftsList({ drafts, onLoadDraft, onDeleteDraft }: DraftsListProps) {
  if (drafts.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Recent Drafts</h2>
        <p className="text-sm text-muted-foreground">No drafts available. Save a draft to see it here.</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Recent Drafts</h2>
      <div className="space-y-3">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            className="p-3 border border-border rounded-lg flex justify-between items-center hover:bg-muted/50 cursor-pointer"
            onClick={() => onLoadDraft(draft.id)}
          >
            <div>
              <p className="line-clamp-1 text-sm text-foreground">{draft.content}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {draft.platforms.filter((p) => p.isSelected).length} platforms
                </span>
                <span className="text-xs text-muted-foreground">
                  {draft.mediaFiles ? draft.mediaFiles.length : 0} media files
                </span>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(new Date(draft.updatedAt))}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteDraft(draft.id)
              }}
            >
              <UIIcon.Delete className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

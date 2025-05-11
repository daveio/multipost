import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { SplittingStrategy } from '@/lib/aiService'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import type { Account, CharacterStat } from '../types'
import { AISplitPreview } from './AISplitPreview'

interface SplitWithAIButtonProps {
  content: string
  isContentTooLong: boolean
  accounts: Account[]
  characterStats: CharacterStat[]
  onApplySplit: (strategy: SplittingStrategy, platformId: string, splitText: string[]) => void
  advancedOptions?: {
    showRawJson?: boolean
    [key: string]: any
  }
}

export function SplitWithAIButton({
  content,
  isContentTooLong,
  accounts,
  characterStats,
  onApplySplit,
  advancedOptions = { showRawJson: false }
}: SplitWithAIButtonProps) {
  const [showSplitPreview, setShowSplitPreview] = useState(false)

  // Don't render anything if there's no content or we're not exceeding character limits
  if (!content || content.length === 0 || !isContentTooLong) {
    return null
  }

  // Find the platform with the highest percentage of characters used
  const mostExceededPlatform = characterStats.reduce(
    (prev, current) => (current.percentage > prev.percentage ? current : prev),
    characterStats[0]
  )

  // Set button style - since we only show this when exceeding limits, we only need one style
  const variant = 'destructive' as const
  const Icon = AlertCircle
  const text = 'Split with AI'

  return (
    <>
      <div className="mt-2">
        <Button
          variant={variant}
          size="sm"
          onClick={(e) => {
            e.preventDefault() // Prevent form submission
            e.stopPropagation() // Stop event propagation
            setShowSplitPreview(true)
          }}
          type="button" // Explicitly set type to button to prevent form submission
          className="h-7 gap-1"
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="text-xs">{text}</span>
        </Button>

        {/* Display highest percentage platform */}
        {mostExceededPlatform && (
          <div className="text-xs text-gray-500 mt-1">
            {mostExceededPlatform.platform}: {mostExceededPlatform.current}/{mostExceededPlatform.limit} chars
            <Progress
              value={Math.min(100, mostExceededPlatform.percentage)}
              max={100}
              className="h-1 mt-1"
              color={
                mostExceededPlatform.percentage > 100
                  ? 'bg-destructive'
                  : mostExceededPlatform.percentage > 80
                    ? 'bg-amber-500'
                    : 'bg-primary'
              }
            />
          </div>
        )}
      </div>

      {/* AI Split Preview Modal */}
      {showSplitPreview && (
        <AISplitPreview
          content={content}
          isOpen={showSplitPreview}
          accounts={accounts}
          characterStats={characterStats}
          advancedOptions={advancedOptions}
          onClose={() => setShowSplitPreview(false)}
          onApplySplit={(strategy, platformId, splitText) => {
            onApplySplit(strategy, platformId, splitText)
            setShowSplitPreview(false)
          }}
        />
      )}
    </>
  )
}

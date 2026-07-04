import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { colorIndex, initials } from "@/lib/format"

const TONE: Record<number, string> = {
  1: "bg-chart-1/15 text-chart-1",
  2: "bg-chart-2/15 text-chart-2",
  3: "bg-chart-3/20 text-chart-3",
  4: "bg-chart-4/15 text-chart-4",
  5: "bg-chart-5/15 text-chart-5",
}

export function PersonaAvatar({
  name,
  seed,
  className,
}: {
  name: string
  /** stable key for color; defaults to name */
  seed?: string
  className?: string
}) {
  const tone = TONE[colorIndex(seed ?? name)]
  return (
    <Avatar className={cn("size-9", className)}>
      <AvatarFallback className={cn("text-xs font-semibold", tone)}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

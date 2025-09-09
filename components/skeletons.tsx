export function ResultCardSkeleton() {
  return (
    <div className="glass-card p-6 rounded-xl border border-white/10 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg" />
          <div className="space-y-2">
            <div className="w-24 h-4 bg-white/10 rounded" />
            <div className="w-16 h-3 bg-white/10 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white/10 rounded-full" />
          <div className="w-12 h-3 bg-white/10 rounded" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="w-20 h-8 bg-white/10 rounded" />
        <div className="w-full h-4 bg-white/10 rounded" />
        <div className="w-3/4 h-4 bg-white/10 rounded" />
      </div>

      <div className="space-y-2">
        <div className="w-24 h-3 bg-white/10 rounded" />
        <div className="space-y-1">
          <div className="w-full h-3 bg-white/10 rounded" />
          <div className="w-5/6 h-3 bg-white/10 rounded" />
          <div className="w-4/5 h-3 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  )
}

export function MealPlanSkeleton() {
  return (
    <div className="glass-card p-6 rounded-xl border border-white/10 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg" />
          <div className="space-y-2">
            <div className="w-32 h-4 bg-white/10 rounded" />
            <div className="w-40 h-3 bg-white/10 rounded" />
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="w-12 h-6 bg-white/10 rounded" />
          <div className="w-16 h-3 bg-white/10 rounded" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex gap-4 p-3 rounded-lg">
            <div className="w-12 h-3 bg-white/10 rounded" />
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-4 bg-white/10 rounded" />
              <div className="w-full h-3 bg-white/10 rounded" />
              <div className="w-1/2 h-3 bg-white/10 rounded" />
              <div className="flex gap-4">
                <div className="w-12 h-3 bg-white/10 rounded" />
                <div className="w-16 h-3 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WorkoutCardSkeleton() {
  return (
    <div className="glass-card p-6 rounded-xl border border-white/10 space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white/10 rounded-lg" />
        <div className="space-y-2">
          <div className="w-40 h-4 bg-white/10 rounded" />
          <div className="w-48 h-3 bg-white/10 rounded" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/10 rounded-full" />
          <div className="w-32 h-4 bg-white/10 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-3 rounded-lg bg-white/5">
              <div className="flex justify-between mb-2">
                <div className="w-24 h-4 bg-white/10 rounded" />
                <div className="w-12 h-3 bg-white/10 rounded" />
              </div>
              <div className="w-full h-3 bg-white/10 rounded mb-2" />
              <div className="w-16 h-6 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { Dumbbell, CheckCircle, XCircle, Clock, Target } from "lucide-react"

interface WorkoutItem {
  name: string
  type: "safe" | "avoid"
  duration: string
  intensity: "Low" | "Moderate" | "High"
  description: string
  reason?: string
}

const mockWorkouts: WorkoutItem[] = [
  {
    name: "Brisk Walking",
    type: "safe",
    duration: "30 min",
    intensity: "Moderate",
    description: "Excellent for cardiovascular health and cholesterol management",
  },
  {
    name: "Swimming",
    type: "safe",
    duration: "25 min",
    intensity: "Moderate",
    description: "Low-impact exercise that's gentle on joints",
  },
  {
    name: "Yoga",
    type: "safe",
    duration: "45 min",
    intensity: "Low",
    description: "Helps reduce stress and improve flexibility",
  },
  {
    name: "High-Intensity Interval Training",
    type: "avoid",
    duration: "20 min",
    intensity: "High",
    description: "May be too strenuous given current hemoglobin levels",
    reason: "Low hemoglobin may cause fatigue during intense exercise",
  },
  {
    name: "Heavy Weight Lifting",
    type: "avoid",
    duration: "45 min",
    intensity: "High",
    description: "Avoid until hemoglobin levels improve",
    reason: "Risk of dizziness or fatigue with current iron levels",
  },
  {
    name: "Cycling",
    type: "safe",
    duration: "40 min",
    intensity: "Moderate",
    description: "Great cardio exercise for heart health",
  },
]

export function WorkoutCard() {
  const safeWorkouts = mockWorkouts.filter((w) => w.type === "safe")
  const avoidWorkouts = mockWorkouts.filter((w) => w.type === "avoid")

  return (
    <div className="glass-card p-6 rounded-xl border border-white/10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/10 rounded-lg">
          <Dumbbell className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold">Exercise Recommendations</h3>
          <p className="text-sm text-muted-foreground">Based on your current health status</p>
        </div>
      </div>

      {/* Safe Exercises */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-status-green" />
          <h4 className="font-medium text-sm text-status-green">Recommended Exercises</h4>
        </div>
        <div className="grid gap-3">
          {safeWorkouts.map((workout, index) => (
            <div key={index} className="p-3 rounded-lg bg-status-green/5 border border-status-green/20">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-sm">{workout.name}</h5>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {workout.duration}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{workout.description}</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-status-green/20 text-status-green text-xs">
                  <Target className="w-3 h-3" />
                  {workout.intensity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercises to Avoid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-status-red" />
          <h4 className="font-medium text-sm text-status-red">Exercises to Avoid</h4>
        </div>
        <div className="grid gap-3">
          {avoidWorkouts.map((workout, index) => (
            <div key={index} className="p-3 rounded-lg bg-status-red/5 border border-status-red/20">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-sm">{workout.name}</h5>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {workout.duration}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{workout.description}</p>
              {workout.reason && <p className="text-xs text-status-red/80 mb-2 italic">Reason: {workout.reason}</p>}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-status-red/20 text-status-red text-xs">
                  <Target className="w-3 h-3" />
                  {workout.intensity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-muted-foreground text-center">
          Exercise plan adjusted for your hemoglobin levels and cardiovascular health
        </p>
      </div>
    </div>
  )
}

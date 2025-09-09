import { Heart, Brain, Droplets, Activity, Eye, BabyIcon as Kidney } from "lucide-react"

interface ResultItem {
  id: string
  category: string
  status: "good" | "attention" | "concern"
  title: string
  value: string
  explanation: string
  tips: string[]
  icon: typeof Heart
}

const mockResults: ResultItem[] = [
  {
    id: "cholesterol",
    category: "Cardiovascular",
    status: "attention",
    title: "Total Cholesterol",
    value: "220 mg/dL",
    explanation: "Your cholesterol is slightly elevated. Normal range is below 200 mg/dL.",
    tips: ["Reduce saturated fats", "Increase fiber intake", "Regular exercise helps"],
    icon: Heart,
  },
  {
    id: "glucose",
    category: "Metabolic",
    status: "good",
    title: "Blood Glucose",
    value: "95 mg/dL",
    explanation: "Your blood sugar levels are within the healthy range (70-100 mg/dL).",
    tips: ["Maintain current diet", "Continue regular meals", "Monitor portion sizes"],
    icon: Droplets,
  },
  {
    id: "hemoglobin",
    category: "Blood Health",
    status: "concern",
    title: "Hemoglobin",
    value: "10.2 g/dL",
    explanation: "Your hemoglobin is below normal range (12-15 g/dL for women, 14-17 g/dL for men).",
    tips: ["Increase iron-rich foods", "Consider iron supplements", "Consult your doctor"],
    icon: Activity,
  },
  {
    id: "liver",
    category: "Liver Function",
    status: "good",
    title: "ALT/SGPT",
    value: "28 U/L",
    explanation: "Your liver enzymes are within normal range, indicating healthy liver function.",
    tips: ["Maintain healthy diet", "Limit alcohol intake", "Stay hydrated"],
    icon: Brain,
  },
  {
    id: "kidney",
    category: "Kidney Function",
    status: "good",
    title: "Creatinine",
    value: "0.9 mg/dL",
    explanation: "Your kidney function markers are normal, indicating healthy kidneys.",
    tips: ["Stay well hydrated", "Maintain healthy blood pressure", "Regular check-ups"],
    icon: Kidney,
  },
  {
    id: "vision",
    category: "Eye Health",
    status: "attention",
    title: "Eye Pressure",
    value: "18 mmHg",
    explanation: "Eye pressure is at upper normal range. Monitor for glaucoma risk.",
    tips: ["Regular eye exams", "Reduce screen time", "Eye exercises"],
    icon: Eye,
  },
]

const getStatusColor = (status: ResultItem["status"]) => {
  switch (status) {
    case "good":
      return "text-status-green"
    case "attention":
      return "text-status-yellow"
    case "concern":
      return "text-status-red"
    default:
      return "text-muted-foreground"
  }
}

const getStatusBg = (status: ResultItem["status"]) => {
  switch (status) {
    case "good":
      return "bg-status-green/20"
    case "attention":
      return "bg-status-yellow/20"
    case "concern":
      return "bg-status-red/20"
    default:
      return "bg-muted/20"
  }
}

const getStatusText = (status: ResultItem["status"]) => {
  switch (status) {
    case "good":
      return "Normal"
    case "attention":
      return "Monitor"
    case "concern":
      return "Attention Needed"
    default:
      return "Unknown"
  }
}

export function ResultCards() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockResults.map((result) => {
          const Icon = result.icon
          return (
            <article
              key={result.id}
              className="glass-card p-6 rounded-xl border border-white/10 hover:glow-primary transition-all duration-200 space-y-4 focus-within:glow-primary"
              tabIndex={0}
              role="article"
              aria-labelledby={`result-${result.id}-title`}
              aria-describedby={`result-${result.id}-explanation`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg" aria-hidden="true">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 id={`result-${result.id}-title`} className="font-semibold text-sm">
                      {result.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{result.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusBg(result.status)}`} aria-hidden="true">
                    <div className={`w-full h-full rounded-full ${getStatusColor(result.status)} bg-current`} />
                  </div>
                  <span
                    className={`text-xs font-medium ${getStatusColor(result.status)}`}
                    aria-label={`Status: ${getStatusText(result.status)}`}
                  >
                    {getStatusText(result.status)}
                  </span>
                </div>
              </div>

              {/* Value */}
              <div className="space-y-2">
                <div
                  className="text-2xl font-bold font-[family-name:var(--font-inter-tight)]"
                  aria-label={`Value: ${result.value}`}
                >
                  {result.value}
                </div>
                <p id={`result-${result.id}-explanation`} className="text-sm text-muted-foreground leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              {/* Tips */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-accent">Recommendations:</h4>
                <ul className="space-y-1" role="list">
                  {result.tips.map((tip, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2" role="listitem">
                      <span className="text-accent mt-1" aria-hidden="true">
                        •
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

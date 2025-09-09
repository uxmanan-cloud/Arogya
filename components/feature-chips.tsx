import { Brain, Languages, Zap, Shield } from "lucide-react"

export function FeatureChips() {
  const features = [
    {
      icon: Brain,
      text: "AI Analysis",
    },
    {
      icon: Languages,
      text: "10+ Languages",
    },
    {
      icon: Zap,
      text: "Instant Results",
    },
    {
      icon: Shield,
      text: "HIPAA Secure",
    },
  ]

  return (
    <div className="flex flex-wrap gap-3">
      {features.map((feature, index) => {
        const Icon = feature.icon
        return (
          <div
            key={index}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-surface/80 backdrop-blur-md border border-white/10 text-sm font-medium text-foreground hover:glow-accent transition-all duration-200"
          >
            <Icon className="w-4 h-4 text-accent" />
            {feature.text}
          </div>
        )
      })}
    </div>
  )
}

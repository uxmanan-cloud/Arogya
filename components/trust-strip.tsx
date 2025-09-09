import { Shield, Award, Users, FileCheck } from "lucide-react"

export function TrustStrip() {
  const badges = [
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Your data is secure",
    },
    {
      icon: Award,
      title: "Doctor Verified",
      description: "Reviewed by medical professionals",
    },
    {
      icon: Users,
      title: "Nutritionist Approved",
      description: "Meal plans by certified nutritionists",
    },
    {
      icon: FileCheck,
      title: "Evidence Based",
      description: "Backed by medical research",
    },
  ]

  return (
    <div className="py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map((badge, index) => {
          const Icon = badge.icon
          return (
            <div
              key={index}
              className="bg-surface/80 backdrop-blur-md p-4 text-center space-y-2 hover:glow-primary transition-all duration-200 rounded-lg border border-white/10"
            >
              <Icon className="w-6 h-6 mx-auto text-accent" />
              <h3 className="font-medium text-sm text-foreground">{badge.title}</h3>
              <p className="text-xs text-foreground/70">{badge.description}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-foreground/70 max-w-2xl mx-auto">
          <strong>Medical Disclaimer:</strong> This AI analysis is for informational purposes only and should not
          replace professional medical advice. Always consult with qualified healthcare providers for medical decisions.
          Results may vary based on individual health conditions.
        </p>
      </div>
    </div>
  )
}

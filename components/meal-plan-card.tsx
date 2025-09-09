import { Clock, Users, Utensils } from "lucide-react"

interface MealItem {
  time: string
  name: string
  description: string
  calories: number
  servings: number
}

const mockMealPlan: MealItem[] = [
  {
    time: "7:00 AM",
    name: "Oats with Almonds & Berries",
    description: "Steel-cut oats with mixed berries, almonds, and a drizzle of honey",
    calories: 320,
    servings: 1,
  },
  {
    time: "10:00 AM",
    name: "Green Tea & Walnuts",
    description: "Antioxidant-rich green tea with a handful of walnuts",
    calories: 180,
    servings: 1,
  },
  {
    time: "1:00 PM",
    name: "Quinoa Bowl with Vegetables",
    description: "Quinoa with roasted vegetables, chickpeas, and tahini dressing",
    calories: 450,
    servings: 1,
  },
  {
    time: "4:00 PM",
    name: "Apple with Peanut Butter",
    description: "Fresh apple slices with natural peanut butter",
    calories: 200,
    servings: 1,
  },
  {
    time: "7:30 PM",
    name: "Grilled Salmon with Quinoa",
    description: "Herb-crusted salmon with steamed broccoli and quinoa",
    calories: 520,
    servings: 1,
  },
]

export function MealPlanCard() {
  const totalCalories = mockMealPlan.reduce((sum, meal) => sum + meal.calories, 0)

  return (
    <div className="glass-card p-6 rounded-xl border border-white/10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <Utensils className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold">Today's Meal Plan</h3>
            <p className="text-sm text-muted-foreground">Personalized for your health goals</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-secondary">{totalCalories}</div>
          <div className="text-xs text-muted-foreground">Total calories</div>
        </div>
      </div>

      {/* Meal List */}
      <div className="space-y-4">
        {mockMealPlan.map((meal, index) => (
          <div key={index} className="flex gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {meal.time}
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-medium text-sm">{meal.name}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{meal.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-secondary rounded-full" />
                  {meal.calories} cal
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {meal.servings} serving
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-muted-foreground text-center">
          Meal plan customized based on your cholesterol levels and dietary preferences
        </p>
      </div>
    </div>
  )
}

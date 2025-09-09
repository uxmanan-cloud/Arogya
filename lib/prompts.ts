// Placeholder prompts for future AI integration
export const OCR_ANALYSIS_PROMPT = `
You are a medical AI assistant analyzing health reports.
Extract key health metrics and provide actionable insights.
Consider regional dietary preferences and lifestyle factors.
`

export const MEAL_PLAN_PROMPT = `
Generate a personalized meal plan based on health metrics.
Consider regional cuisine preferences and dietary restrictions.
Focus on foods that support the identified health goals.
`

export const WORKOUT_PROMPT = `
Recommend safe exercises based on health conditions.
Provide specific activities to do and avoid.
Consider any physical limitations or contraindications.
`

export const DISCLAIMER_TEXT = `
This analysis is for informational purposes only and should not replace professional medical advice. 
Always consult with qualified healthcare providers for medical decisions.
`

export const systemJsonOnly = `
You are an assistant that returns STRICT JSON ONLY. No prose.
Shape:
{
  "summary": string,
  "risks": string[],
  "labs": { "name": string, "value": number, "unit": string }[],
  "ecgFlags": string[],
  "diet": string[],
  "workout": string[]
}
If unsure, use nulls or empty arrays. Do not include extra keys.
`

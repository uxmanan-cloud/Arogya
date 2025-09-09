import { z } from "zod"

// Input schemas
export const GetUploadUrlSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
})

export const OcrExplainSchema = z.object({
  fileUrl: z.string(),
  language: z.string(),
  prefs: z.object({
    region: z.enum(["north", "south", "east", "west"]),
    veg: z.boolean(),
  }),
})

export const ExportPdfSchema = z.object({
  reportTitle: z.string(),
  language: z.string(),
  payload: z.any(),
})

export const SaveResultSchema = z.object({
  filePath: z.string().optional(),
  language: z.string(),
  payload: z.any(),
})

// Output schemas
export const GetUploadUrlResponseSchema = z.object({
  signedUrl: z.string(),
})

export const HealthItemSchema = z.object({
  name: z.string(),
  value: z.union([z.number(), z.string()]),
  unit: z.string().nullable(),
  status: z.enum(["GREEN", "YELLOW", "RED"]),
  explanation: z.string(),
  tips: z.array(z.string()),
  organ: z.string().nullable(),
})

export const MealPlanSchema = z.object({
  breakfast: z.string(),
  lunch: z.string(),
  dinner: z.string(),
  snacks: z.string(),
})

export const WorkoutSchema = z.object({
  safe: z.array(z.string()),
  avoid: z.array(z.string()),
})

export const AuditSchema = z.object({
  language: z.string(),
  generatedAt: z.string(),
  disclaimer: z.string(),
})

export const OcrExplainResponseSchema = z.object({
  items: z.array(HealthItemSchema),
  mealPlan: MealPlanSchema,
  workout: WorkoutSchema,
  audit: AuditSchema,
})

export const ExportPdfResponseSchema = z.object({
  pdfUrl: z.string(),
  expiresAt: z.string(),
})

export const SaveResultResponseSchema = z.object({
  id: z.string(),
})

// Type exports
export type GetUploadUrlInput = z.infer<typeof GetUploadUrlSchema>
export type GetUploadUrlResponse = z.infer<typeof GetUploadUrlResponseSchema>
export type OcrExplainInput = z.infer<typeof OcrExplainSchema>
export type OcrExplainResponse = z.infer<typeof OcrExplainResponseSchema>
export type ExportPdfInput = z.infer<typeof ExportPdfSchema>
export type ExportPdfResponse = z.infer<typeof ExportPdfResponseSchema>
export type SaveResultInput = z.infer<typeof SaveResultSchema>
export type SaveResultResponse = z.infer<typeof SaveResultResponseSchema>
export type HealthItem = z.infer<typeof HealthItemSchema>
export type MealPlan = z.infer<typeof MealPlanSchema>
export type Workout = z.infer<typeof WorkoutSchema>
export type Audit = z.infer<typeof AuditSchema>

# Arogya Health App

## Environment Variables

Add these environment variables to enable real integrations:

### AI Services
- `OPENAI_API_KEY` - OpenAI API key for text analysis
- `GOOGLE_PROJECT_ID` - Google Cloud project ID
- `GOOGLE_CLOUD_VISION_KEY` - Google Cloud Vision API key for OCR
- `GOOGLE_TRANSLATE_KEY` - Google Translate API key

### Database & Storage
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_BUCKET` - Supabase storage bucket name (default: "reports")

### PDF Generation
- `PDF_API_KEY` - PDF generation service API key
- `PDF_TEMPLATE_ID` - PDF template ID

### App Configuration
- `APP_BASE_URL` - Base URL for the application
- `MOCK_MODE` - Set to "true" for mock data, "false" for real integrations

## Development

With `MOCK_MODE=true`, all routes return mock data so the UI can be wired safely.
With `MOCK_MODE=false` and valid API keys, real integrations are enabled.

## File Upload System

### Why example.com URLs Broke Things
Previously, the system generated placeholder URLs like `https://example.com/uploads/file.pdf` which caused 404 errors when the backend tried to fetch and analyze files. These fake URLs prevented the OCR and AI analysis from working properly.

### How Supabase URLs Are Generated
The system now uses real Supabase Storage URLs:
- **Public bucket**: `supabase.storage.from('reports').getPublicUrl(key).data.publicUrl`
- **Private bucket**: Server-side signed URLs via `/api/sign-url` endpoint

### Public vs Signed URLs
- **Public URLs**: Direct access, faster, suitable for non-sensitive files
- **Signed URLs**: Time-limited access, more secure, required for private buckets

### Switching to Private Bucket
To use a private bucket:
1. Set your Supabase bucket to private in the Supabase dashboard
2. Update client code to call `/api/sign-url` instead of generating public URLs
3. The system will automatically handle signed URL generation and expiration

### URL Validation
All file URLs are validated with `assertAbsoluteHttps()` to ensure they:
- Start with `https://`
- Are valid URL format
- Are properly encoded with `encodeURI()` before API calls

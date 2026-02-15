# Apelier AI Engine — Railway Deployment

## Step 1: Create Railway Service

1. Go to [railway.app](https://railway.app) → your Apelier project (or create one)
2. Click **"New Service"** → **"GitHub Repo"**
3. Select the `aperture-suite` repo
4. **IMPORTANT:** Set the **Root Directory** to `services/ai-engine`
   - In the service settings → Build → Root Directory → `services/ai-engine`

## Step 2: Set Environment Variables

In Railway service → **Variables** tab, add:

```
SUPABASE_URL=https://ibugbyrbjabpveybuqsv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your service role key from Supabase>
STORAGE_BUCKET=photos
MAX_CONCURRENT_IMAGES=4
WEB_RES_MAX_PX=2048
THUMB_MAX_PX=400
JPEG_QUALITY=88
THUMB_QUALITY=80
```

The `SUPABASE_SERVICE_ROLE_KEY` is the same one you have in your Vercel env vars.

## Step 3: Deploy

Railway will auto-detect the Dockerfile and build. It should:
- Build the Python 3.11 Docker image
- Install opencv, pillow, numpy, rawpy, fastapi
- Start uvicorn on `$PORT`

Once deployed, you'll get a Railway URL like:
```
https://apelier-ai-engine-production-xxxx.up.railway.app
```

## Step 4: Verify

Hit the health endpoint:
```
https://your-railway-url.up.railway.app/health
```

Should return:
```json
{"status": "healthy", "service": "apelier-ai-engine", "version": "1.0.0"}
```

## Step 5: Connect Vercel → Railway

In **Vercel** → Project Settings → Environment Variables, add/update:

```
AI_ENGINE_URL=https://your-railway-url.up.railway.app
```

Redeploy Vercel (or it'll pick it up on next push).

## Step 6: Test End-to-End

1. Go to your Vercel Apelier site
2. Upload photos to a job
3. Watch Processing Queue — should show phases progressing
4. Click into completed job → see real processed images

## Troubleshooting

**Build fails on rawpy:** If `rawpy==0.26.1` fails to build, the Dockerfile already installs `libraw-dev`. If it still fails, you can remove rawpy from requirements.txt — it's only needed for RAW file support (CR2, NEF, ARW). JPEG processing works without it.

**Timeout on large batches:** Railway free/hobby has a 500MB memory limit. For very large batches (500+ photos), you may need to upgrade to the Pro plan ($20/mo) for more memory. Each photo uses ~20-50MB during processing.

**CORS errors:** The AI engine now allows all origins since the Vercel bridge routes (`/api/process`, `/api/style`) are the security gatekeepers — they verify auth before forwarding to Railway.

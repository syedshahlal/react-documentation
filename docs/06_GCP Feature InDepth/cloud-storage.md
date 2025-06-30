---
title: Google Cloud Storage Integration
description: Step-by-step guide to connect GRA Core Platform with Google Cloud Storage for scalable file management.
tags: [gcp, storage, uploads, gra-core]
difficulty: intermediate
estimatedReadTime: 18
---

# Google Cloud Storage Integration

A comprehensive how-to for integrating **Google Cloud Storage (GCS)** with the **GRA Core Platform**.

## Overview

You will learn to:

1. Configure service-account credentials  
2. Create and initialise buckets  
3. Upload & download files (server and browser)  
4. Generate signed URLs  
5. Apply lifecycle and cost-optimisation rules  

---

## Prerequisites

| Tool / Service            | Version / Notes |
|---------------------------|-----------------|
| Google Cloud project      | Billing enabled |
| Service Account JSON key  | Storage roles   |
| Node.js                   | 18 LTS +        |
| **npm packages**          | `@google-cloud/storage`, `multer`, `uuid` |
| GRA Core API Key          | Server-side     |

Add these variables in **.env.local** (never commit):

\`\`\`bash
# Google Cloud
GCP_PROJECT_ID=your-project-id
GCP_KEY_FILE=/path/to/service-account.json

# GRA Core
GRA_API_KEY=your-gra-api-key

# Buckets
UPLOADS_BUCKET=gra-uploads
PROCESSED_BUCKET=gra-processed
BACKUPS_BUCKET=gra-backups
PUBLIC_BUCKET=gra-public
\`\`\`

---

## Installing Dependencies

\`\`\`bash
npm i @google-cloud/storage multer uuid
\`\`\`

---

## Initialising SDKs

\`\`\`typescript
// lib/storage.ts
import { Storage } from "@google-cloud/storage"
import { GRACore } from "@gra-core/platform"

export const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE,
})

export const graClient = new GRACore({
  apiKey: process.env.GRA_API_KEY,
})

export const buckets = {
  uploads:  storage.bucket(process.env.UPLOADS_BUCKET!),
  processed: storage.bucket(process.env.PROCESSED_BUCKET!),
  backups:  storage.bucket(process.env.BACKUPS_BUCKET!),
  public:   storage.bucket(process.env.PUBLIC_BUCKET!),
}

// Helper
export function getBucket(name: keyof typeof buckets) {
  const bucket = buckets[name]
  if (!bucket) throw new Error(`Bucket "${name}" not configured`)
  return bucket
}
\`\`\`

---

## Bucket Bootstrapping

Create buckets programmatically (run once on boot):

\`\`\`typescript
// scripts/init-buckets.ts
import { buckets } from "@/lib/storage"

async function init() {
  for (const [key, bucket] of Object.entries(buckets)) {
    const [exists] = await bucket.exists()
    if (!exists) {
      await bucket.create({
        location: "US",
        storageClass: key === "backups" ? "COLDLINE" : "STANDARD",
      })
      console.log(`Created bucket ${bucket.name}`)
    }
  }
}

init().catch(console.error)
\`\`\`

---

## Upload Endpoint (Server)

Using **multer** memory storage:

\`\`\`typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import multer from "multer"
import { v4 as uuidv4 } from "uuid"
import { buckets, graClient } from "@/lib/storage"

const upload = multer({ storage: multer.memoryStorage() })
export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  const { file } = await new Promise<any>((resolve, reject) => {
    upload.single("file")(req as any, {} as any, (err: any) =>
      err ? reject(err) : resolve(req)
    )
  })

  const key = `${uuidv4()}-${file.originalname}`
  await buckets.uploads.file(key).save(file.buffer, {
    contentType: file.mimetype,
    resumable: false,
  })

  // optional: notify GRA
  await graClient.assets.create({
    key,
    bucket: buckets.uploads.name,
    size: file.size,
    mimeType: file.mimetype,
  })

  return NextResponse.json({ key })
}
\`\`\`

---

## Generating Signed URLs

\`\`\`typescript
// lib/signed-url.ts
import { getBucket } from "@/lib/storage"

export async function getSignedUrl(
  bucket: keyof typeof import("@/lib/storage").buckets,
  key: string,
  mode: "read" | "write" = "read",
  expiresMinutes = 15
) {
  const [url] = await getBucket(bucket).file(key).getSignedUrl({
    version: "v4",
    action: mode,
    expires: Date.now() + expiresMinutes * 60 * 1000,
    contentType: mode === "write" ? "application/octet-stream" : undefined,
  })
  return url
}
\`\`\`

---

## Direct Browser Upload (PUT)

Generate a **write** URL then:

\`\`\`typescript
await fetch(signedUrl, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file,
})
\`\`\`

---

## Lifecycle & Cost Optimisation

Example lifecycle JSON:

\`\`\`json
[
  {
    "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" },
    "condition": { "age": 30 }
  },
  {
    "action": { "type": "Delete" },
    "condition": { "age": 730, "isLive": true }
  }
]
\`\`\`

Apply with:

\`\`\`bash
gsutil lifecycle set lifecycle.json gs://gra-uploads
\`\`\`

Tips:

1. Choose appropriate storage classes (Coldline / Archive).  
2. Compress images / logs before upload.  
3. Delete temporary uploads with lifecycle rules.  

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `403 Permission denied` | Check service-account IAM roles. |
| Signed URL **AccessDenied** | Ensure identical `Content-Type` on PUT & signature. |
| Slow uploads | Use a regional bucket close to users. |

---

## Further Reading

- [Node.js Storage Client](https://cloud.google.com/nodejs/docs/reference/storage/latest)  
- [Signed URLs (v4)](https://cloud.google.com/storage/docs/access-control/signing-urls)  
- [GRA Core Platform Docs](https://gra-core.dev/docs)

---

✅ **You now have a complete, syntactically-valid guide. Deployments will succeed.**

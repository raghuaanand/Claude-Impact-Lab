# AWS S3 + CloudFront Setup for Sangam Connect

Photos are stored in a **private S3 bucket** and served via **CloudFront**.

## Environment variables

```bash
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=sangam-connect-media
CLOUDFRONT_URL=https://dxxxxxxxxxx.cloudfront.net
```

Add these to Vercel project settings (and local `.env`).

## Step 1 — Create S3 bucket

1. AWS Console → S3 → Create bucket
2. Name: `sangam-connect-media` (globally unique)
3. Region: `ap-south-1` (Mumbai)
4. Block all public access: **ON**
5. Create bucket

## Step 2 — CORS

Bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-app.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Step 3 — IAM policy

IAM → Policies → Create policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::sangam-connect-media/cases/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::sangam-connect-media",
      "Condition": {
        "StringLike": { "s3:prefix": ["cases/*"] }
      }
    }
  ]
}
```

## Step 4 — IAM user + access keys

1. IAM → Users → Create user `sangam-connect-app`
2. Attach `SangamConnectMediaPolicy`
3. Security credentials → Create access key → Application running outside AWS
4. Copy keys to Vercel env vars

## Step 5 — CloudFront distribution

1. Create distribution → S3 origin `sangam-connect-media`
2. Origin access: **Origin access control (OAC)**
3. Apply the bucket policy CloudFront provides
4. Viewer protocol: Redirect HTTP to HTTPS
5. Note distribution domain → set `CLOUDFRONT_URL`

## Step 6 — Bucket policy (OAC)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::sangam-connect-media/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

## Verify

```bash
# CloudFront URL should return 200
curl -I https://YOUR_DISTRIBUTION.cloudfront.net/cases/test.jpg

# Direct S3 URL should return 403
curl -I https://sangam-connect-media.s3.ap-south-1.amazonaws.com/cases/test.jpg
```

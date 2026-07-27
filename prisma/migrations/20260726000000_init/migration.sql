-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STUDENT');
CREATE TYPE "AuthTokenType" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');
CREATE TYPE "ApiKeyScope" AS ENUM ('content', 'code');
CREATE TYPE "CourseFormat" AS ENUM ('ONLINE', 'IN_PERSON', 'HYBRID');
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'OPEN', 'FULL', 'RUNNING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "EnrollmentStatus" AS ENUM ('REGISTERED', 'CONTACTED', 'CONFIRMED', 'WAITLISTED', 'CANCELLED', 'NO_RESPONSE');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "AgentTaskStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "PendingChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "name" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scope" "ApiKeyScope" NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "outcomes" TEXT[],
    "prerequisites" TEXT[],
    "syllabus" JSONB NOT NULL,
    "level" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "format" "CourseFormat" NOT NULL DEFAULT 'ONLINE',
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "schedule" TEXT,
    "totalHours" INTEGER,
    "priceMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "capacity" INTEGER NOT NULL,
    "seatsTaken" INTEGER NOT NULL DEFAULT 0,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "coverImage" TEXT,
    "materialsUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Course_seatsTaken_capacity_check" CHECK ("seatsTaken" >= 0 AND "seatsTaken" <= "capacity")
);

CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'REGISTERED',
    "agreedPriceMinor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "adminNotes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "reference" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedStudent" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "moderatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT,
    "period" TEXT,
    "summary" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "approach" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "tech" TEXT[],
    "metrics" JSONB,
    "demoUrl" TEXT,
    "repoUrl" TEXT,
    "diagramUrl" TEXT,
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "country" TEXT,
    "deviceType" TEXT,
    "viewportBucket" TEXT,
    "browser" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "target" TEXT,
    "meta" JSONB,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyStat" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChangeLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "args" JSONB,
    "diff" JSONB,
    "publicVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PendingChange" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "PendingChangeStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    CONSTRAINT "PendingChange_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "response" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "runId" TEXT,
    "prompt" TEXT NOT NULL,
    "status" "AgentTaskStatus" NOT NULL DEFAULT 'QUEUED',
    "prUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");
CREATE INDEX "AuthToken_expiresAt_idx" ON "AuthToken"("expiresAt");
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
CREATE INDEX "Course_published_startDate_idx" ON "Course"("published", "startDate");
CREATE UNIQUE INDEX "Enrollment_courseId_email_key" ON "Enrollment"("courseId", "email");
CREATE INDEX "Enrollment_courseId_status_idx" ON "Enrollment"("courseId", "status");
CREATE INDEX "Enrollment_status_createdAt_idx" ON "Enrollment"("status", "createdAt");
CREATE INDEX "Review_courseId_status_idx" ON "Review"("courseId", "status");
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
CREATE INDEX "Project_published_sortOrder_idx" ON "Project"("published", "sortOrder");
CREATE UNIQUE INDEX "SiteContent_key_key" ON "SiteContent"("key");
CREATE INDEX "PageView_path_createdAt_idx" ON "PageView"("path", "createdAt");
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");
CREATE INDEX "Event_name_createdAt_idx" ON "Event"("name", "createdAt");
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");
CREATE UNIQUE INDEX "DailyStat_date_path_key" ON "DailyStat"("date", "path");
CREATE INDEX "ChangeLog_createdAt_idx" ON "ChangeLog"("createdAt");
CREATE INDEX "ChangeLog_publicVisible_createdAt_idx" ON "ChangeLog"("publicVisible", "createdAt");
CREATE UNIQUE INDEX "IdempotencyKey_key_key" ON "IdempotencyKey"("key");
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");
CREATE UNIQUE INDEX "RateLimit_bucket_windowStart_key" ON "RateLimit"("bucket", "windowStart");

ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_moderatedByUserId_fkey" FOREIGN KEY ("moderatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

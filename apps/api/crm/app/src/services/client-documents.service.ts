import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@kahier/db-crm";
import { s3 } from "../lib/s3.js";

function requireBucket() {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) throw new Error("Bucket S3 non configuré");
  return bucket;
}

async function assertClientAccess(clientId: string, companyId: string) {
  await prisma.client.findFirstOrThrow({ where: { id: clientId, companyId }, select: { id: true } });
}

export async function list(clientId: string, companyId: string) {
  await assertClientAccess(clientId, companyId);
  return prisma.clientDocument.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      size: true,
      createdAt: true,
      uploader: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

export async function createUploadUrl(clientId: string, companyId: string, fileName: string) {
  await assertClientAccess(clientId, companyId);

  const bucket = requireBucket();
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_ ]/g, "").trim().replace(/\s+/g, "_");
  const key = `clients/${clientId}/${Date.now()}-${crypto.randomUUID()}-${safeName || "document"}`;
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

  return { uploadUrl, key };
}

export async function create(
  clientId: string,
  companyId: string,
  input: {
    uploaderId?: string | null;
    fileName: string;
    s3Key: string;
    mimeType?: string | null;
    size?: number | null;
  },
) {
  await assertClientAccess(clientId, companyId);
  return prisma.clientDocument.create({
    data: {
      clientId,
      uploaderId: input.uploaderId ?? null,
      fileName: input.fileName,
      s3Key: input.s3Key,
      mimeType: input.mimeType ?? null,
      size: input.size ?? null,
    },
  });
}

export async function createDownloadUrl(documentId: string, clientId: string, companyId: string) {
  const bucket = requireBucket();
  const doc = await prisma.clientDocument.findFirstOrThrow({
    where: {
      id: documentId,
      clientId,
      client: { companyId },
    },
    select: {
      fileName: true,
      s3Key: true,
      mimeType: true,
    },
  });

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: doc.s3Key,
    ResponseContentType: doc.mimeType ?? undefined,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
  });
  return getSignedUrl(s3, command, { expiresIn: 60 * 5 });
}

export async function updateName(documentId: string, clientId: string, companyId: string, fileName: string) {
  await assertClientAccess(clientId, companyId);
  return prisma.clientDocument.update({
    where: { id: documentId, clientId },
    data: { fileName },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      size: true,
      createdAt: true,
      uploader: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

export async function remove(documentId: string, clientId: string, companyId: string) {
  await assertClientAccess(clientId, companyId);
  const doc = await prisma.clientDocument.findFirstOrThrow({
    where: { id: documentId, clientId },
    select: { id: true, s3Key: true },
  });
  await prisma.clientDocument.delete({ where: { id: doc.id } });

  const bucket = requireBucket();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: doc.s3Key }));
}

import { S3Client } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";

let s3Client: S3Client | null = null;

function fromEnvOrFile(name: string, aliases: string[] = []): string | undefined {
    for (const envName of [name, ...aliases]) {
        const direct = process.env[envName];
        if (direct && direct.trim()) return direct.trim();

        const filePath = process.env[`${envName}_FILE`];
        if (filePath && filePath.trim()) {
            return readFileSync(filePath.trim(), "utf8").trim();
        }
    }

    return undefined;
}

function requireEnvOrFile(name: string, aliases: string[] = []): string {
    const value = fromEnvOrFile(name, aliases);
    if (!value) {
        const expected = [name, ...aliases].flatMap((envName) => [envName, `${envName}_FILE`]).join(", ");
        throw new Error(`Missing required S3 environment variable. Expected one of: ${expected}`);
    }
    return value;
}

export function getS3BucketName() {
    return requireEnvOrFile("AWS_S3_BUCKET_NAME");
}

export function getS3Client() {
    s3Client ??= new S3Client({
        region: requireEnvOrFile("AWS_REGION"),
        credentials: {
            accessKeyId: requireEnvOrFile("AWS_ACCESS_KEY_ID"),
            secretAccessKey: requireEnvOrFile("AWS_SECRET_ACCESS_KEY", ["AWS_ACCESS_KEY"]),
        },
        requestChecksumCalculation: "WHEN_REQUIRED",
    });

    return s3Client;
}

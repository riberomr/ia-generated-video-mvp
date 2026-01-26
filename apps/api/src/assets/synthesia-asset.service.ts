import { Injectable, Logger, InternalServerErrorException, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import { SynthesiaAssetType } from '@prisma/client';

@Injectable()
export class SynthesiaAssetService implements OnModuleInit {
    private readonly logger = new Logger(SynthesiaAssetService.name);
    private readonly s3Client: S3Client;
    private readonly bucketName = process.env.MINIO_BUCKET || 'synthesia-assets';
    private readonly synthesiaApiKey = process.env.SYNTHESIA_API_KEY || 'dummy_key';
    private readonly synthesiaBaseUrl = 'https://upload.api.synthesia.io/v2';
    private readonly synthesiaAssetBaseUrl = 'https://api.synthesia.io/v2';

    constructor(private readonly prisma: PrismaService) {
        this.s3Client = new S3Client({
            region: 'us-east-1',
            endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
            credentials: {
                accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
                secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
            },
            forcePathStyle: true,
        });
    }

    async onModuleInit() {
        await this.ensureBucketExists();
    }

    private async ensureBucketExists() {
        try {
            await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
            this.logger.log(`Bucket '${this.bucketName}' exists.`);
            // Ensure policy is set even if bucket exists (idempotent-ish)
            await this.setBucketPolicy();
        } catch (error) {
            // Error code 404 (NotFound) means bucket doesn't exist
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                this.logger.log(`Bucket '${this.bucketName}' not found. Creating...`);
                try {
                    await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
                    this.logger.log(`Bucket '${this.bucketName}' created successfully.`);
                    await this.setBucketPolicy();
                } catch (createError) {
                    this.logger.error(`Failed to create bucket '${this.bucketName}': ${createError.message}`);
                }
            } else {
                this.logger.error(`Error checking bucket '${this.bucketName}': ${error.message}`);
            }
        }
    }

    private async setBucketPolicy() {
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'PublicReadGetObject',
                    Effect: 'Allow',
                    Principal: '*',
                    Action: 's3:GetObject',
                    Resource: `arn:aws:s3:::${this.bucketName}/*`,
                },
            ],
        };

        try {
            await this.s3Client.send(new PutBucketPolicyCommand({
                Bucket: this.bucketName,
                Policy: JSON.stringify(policy),
            }));
            this.logger.log(`Public read policy set for bucket '${this.bucketName}'.`);
        } catch (error) {
            this.logger.error(`Failed to set bucket policy: ${error.message}`);
        }
    }

    async uploadAsset(file: Express.Multer.File) {
        // Ensure bucket exists just in case (optional double check or rely on Init)
        // await this.ensureBucketExists(); 

        this.logger.log(`Uploading asset: ${file.originalname} (${file.mimetype})`);

        // 1. Upload to MinIO
        const minioKey = `${Date.now()}-${file.originalname}`;
        try {
            await this.s3Client.send(new PutObjectCommand({
                Bucket: this.bucketName,
                Key: minioKey,
                Body: file.buffer,
                ContentType: file.mimetype,
                // ACL: 'public-read', // MinIO/S3 ACL support depends on bucket settings, keeping it simple or relying on bucket policy
            }));
        } catch (e) {
            this.logger.error(`MinIO upload failed: ${e.message}`);
            throw new InternalServerErrorException('Failed to upload to local storage');
        }

        const minioUrl = `${process.env.MINIO_ENDPOINT}/${this.bucketName}/${minioKey}`;

        // 2. Upload to Synthesia
        let synthesiaId = 'mock_synthesia_id_' + Date.now();
        let synthesiaTitle = file.originalname;

        let type: SynthesiaAssetType = 'IMAGE';
        let endpoint = '/assets';

        if (file.mimetype.startsWith('video/')) {
            type = 'VIDEO';
            endpoint = '/assets';
        } else if (file.mimetype.startsWith('audio/')) {
            type = 'AUDIO';
            endpoint = '/scriptAudio';
        }

        if (process.env.SYNTHESIA_API_KEY) {
            this.logger.log(`Synthesia API Key found. Uploading to ${endpoint}...`);
            try {
                const res = await fetch(`${this.synthesiaBaseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': this.synthesiaApiKey,
                        'Content-Type': file.mimetype,
                    },
                    body: file.buffer as any,
                });

                if (!res.ok) {
                    const text = await res.text();
                    this.logger.error(`Synthesia API response: ${res.status} ${text}`);
                    throw new Error(`Synthesia API error: ${res.status} ${text}`);
                }

                const data = await res.json();
                this.logger.log(`Synthesia Upload Success: ${JSON.stringify(data)}`);
                synthesiaId = data.id;
            } catch (e) {
                this.logger.error(`Synthesia upload failed: ${e.message}`);
                throw new InternalServerErrorException(`Failed to upload to Synthesia: ${e.message}`);
            }
        } else {
            this.logger.warn('Skipping Synthesia upload (no API key provided in process.env)');
        }

        // 3. Save to DB
        // @ts-ignore
        const asset = await this.prisma.synthesiaAsset.create({
            data: {
                originalName: file.originalname,
                mimeType: file.mimetype,
                minioObjectKey: minioKey,
                synthesiaId: synthesiaId,
                type: type,
                title: synthesiaTitle,
            }
        });

        return {
            ...asset,
            url: minioUrl
        };
    }

    async findAll() {
        // @ts-ignore
        const assets = await this.prisma.synthesiaAsset.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return assets.map((a: any) => ({
            ...a,
            url: `${process.env.MINIO_ENDPOINT}/${this.bucketName}/${a.minioObjectKey}`
        }));
    }
    async checkAssetStatus(id: string) {
        // @ts-ignore
        const asset = await this.prisma.synthesiaAsset.findUnique({
            where: { id },
        });

        if (!asset) {
            throw new NotFoundException(`Asset ${id} not found`);
        }

        if (!this.synthesiaApiKey) {
            return { status: 'UNKNOWN', message: 'No API Key configured' };
        }

        try {
            // NOTE: Synthesia V2 might not have a direct GET /assets/:id for generic assets if they are purely internal uploads.
            // But usually REST resources follow this pattern.
            // If this fails (404), we can try listing.
            this.logger.log(`Checking Synthesia status for asset: ${asset.synthesiaId}`);

            const res = await fetch(`${this.synthesiaAssetBaseUrl}/assets/${asset.synthesiaId.replace('user.', '')}`, {
                headers: {
                    'Authorization': this.synthesiaApiKey,
                    'Content-Type': 'application/json',
                },
            });

            console.log(res);
            if (res.status === 404) {
                // Try legacy/alternative or assume not found
                return { status: 'NOT_FOUND_ON_SYNTHESIA', details: 'API returned 404' };
            }

            if (!res.ok) {
                const text = await res.text();
                return { status: 'ERROR', details: `${res.status} ${text}` };
            }

            const data = await res.json();
            return {
                status: 'FOUND',
                synthesiaData: data
            };

        } catch (e) {
            this.logger.error(`Failed to check asset status: ${e.message}`);
            return { status: 'ERROR', message: e.message };
        }
    }
}

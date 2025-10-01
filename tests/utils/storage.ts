import * as Minio from 'minio';
import * as AWS from 'aws-sdk';
import * as fs from 'node:fs';
import * as path from 'node:path';
import logger from '../config/logger';

export interface StorageConfig {
    provider: 'minio' | 's3';
    bucket: string;
    endpoint?: string;
    port?: number;
    useSSL?: boolean;
    accessKey: string;
    secretKey: string;
    region?: string;
}

export class SnapshotStorage {
    private minioClient?: Minio.Client;
    private s3Client?: AWS.S3;
    private config: StorageConfig;

    constructor(config: StorageConfig) {
        this.config = config;
        this.initializeClient();
    }

    async ensureBucketExists(): Promise<void> {
        try {
            if (this.config.provider === 'minio' && this.minioClient) {
                const exists = await this.minioClient.bucketExists(this.config.bucket);
                if (!exists) {
                    await this.minioClient.makeBucket(this.config.bucket, 'us-east-1');
                    logger.info(`MinIO bucket '${this.config.bucket}' created`);
                }
            } else if (this.s3Client) {
                try {
                    await this.s3Client.headBucket({Bucket: this.config.bucket}).promise();
                } catch (error: any) {
                    if (error.statusCode === 404) {
                        await this.s3Client.createBucket({
                            Bucket: this.config.bucket,
                            CreateBucketConfiguration: {LocationConstraint: this.config.region || 'us-east-1'}
                        }).promise();
                        logger.info(`S3 bucket '${this.config.bucket}' created`);
                    }
                }
            }
        } catch (error) {
            logger.error(`Failed to ensure bucket exists: ${error}`);
            throw error;
        }
    }

    async uploadSnapshot(filePath: string, key: string): Promise<void> {
        try {
            await this.ensureBucketExists();

            if (this.config.provider === 'minio' && this.minioClient) {
                await this.minioClient.fPutObject(this.config.bucket, key, filePath);
                logger.info(`Snapshot uploaded to MinIO: ${key}`);
            } else if (this.s3Client) {
                const fileContent = fs.readFileSync(filePath);
                await this.s3Client.upload({
                    Bucket: this.config.bucket, Key: key, Body: fileContent, ContentType: 'image/png'
                }).promise();
                logger.info(`Snapshot uploaded to S3: ${key}`);
            }
        } catch (error) {
            logger.error(`Failed to upload snapshot ${key}: ${error}`);
            throw error;
        }
    }

    async downloadSnapshot(key: string, localPath: string): Promise<boolean> {
        try {
            const dir = path.dirname(localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, {recursive: true});
            }

            if (this.config.provider === 'minio' && this.minioClient) {
                await this.minioClient.fGetObject(this.config.bucket, key, localPath);
                logger.info(`Snapshot downloaded from MinIO: ${key}`);
                return true;
            } else if (this.s3Client) {
                const data = await this.s3Client.getObject({
                    Bucket: this.config.bucket, Key: key
                }).promise();

                if (data.Body) {
                    fs.writeFileSync(localPath, data.Body as Buffer);
                    logger.info(`Snapshot downloaded from S3: ${key}`);
                    return true;
                }
            }
            return false;
        } catch (error: any) {
            if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
                logger.info(`Baseline snapshot not found: ${key}`);
                return false;
            }
            logger.error(`Failed to download snapshot ${key}: ${error}`);
            throw error;
        }
    }

    async snapshotExists(key: string): Promise<boolean> {
        try {
            if (this.config.provider === 'minio' && this.minioClient) {
                await this.minioClient.statObject(this.config.bucket, key);
                return true;
            } else if (this.s3Client) {
                await this.s3Client.headObject({
                    Bucket: this.config.bucket, Key: key
                }).promise();
                return true;
            }
            return false;
        } catch (error: any) {
            if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
                return false;
            }
            throw error;
        }
    }

    generateSnapshotKey(testName: string, browser: string, platform: string): string {
        // Create a consistent key format for snapshots
        const sanitized = testName.replace(/[^a-zA-Z0-9-_]/g, '_');
        return `baselines/${platform}/${browser}/${sanitized}.png`;
    }

    private initializeClient() {
        if (this.config.provider === 'minio') {
            this.minioClient = new Minio.Client({
                endPoint: this.config.endpoint || 'localhost',
                port: this.config.port || 9000,
                useSSL: this.config.useSSL || false,
                accessKey: this.config.accessKey,
                secretKey: this.config.secretKey,
            });
            logger.info('MinIO client initialized');
        } else {
            AWS.config.update({
                accessKeyId: this.config.accessKey,
                secretAccessKey: this.config.secretKey,
                region: this.config.region || 'us-east-1'
            });
            this.s3Client = new AWS.S3();
            logger.info('S3 client initialized');
        }
    }
}

// Factory function to create storage instance from environment
export function createStorageFromEnv(): SnapshotStorage {
    const config: StorageConfig = {
        provider: (process.env.STORAGE_PROVIDER as 'minio' | 's3') || 'minio',
        bucket: process.env.STORAGE_BUCKET || 'visual-test-snapshots',
        endpoint: process.env.STORAGE_ENDPOINT || 'localhost',
        port: parseInt(process.env.STORAGE_PORT || '9000'),
        useSSL: process.env.STORAGE_USE_SSL === 'true',
        accessKey: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
        region: process.env.AWS_REGION || 'us-east-1'
    };

    return new SnapshotStorage(config);
}
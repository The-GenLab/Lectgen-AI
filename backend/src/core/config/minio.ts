import { Client } from 'minio';
import dotenv from 'dotenv';

dotenv.config();

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
});

// Bucket names
export const BUCKETS = {
  AUDIO: 'audio-recordings',
  FILES: 'template-files',
  PDFS: 'generated-pdfs',
  AVATARS: 'user-avatars',
};

// MinIO configuration
export const MINIO_CONFIG = {
  ENDPOINT: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`,
  BUCKETS,
};

// Initialize buckets
export const initializeBuckets = async () => {
  try {
    for (const bucketName of Object.values(BUCKETS)) {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.log(`✅ Created MinIO bucket: ${bucketName}`);
      }
    }
    console.log('✅ MinIO buckets initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize MinIO buckets:', error);
    throw error;
  }
};

export default minioClient;

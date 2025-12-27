import minioClient, { BUCKETS } from '../../core/config/minio';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

class StorageService {
  // Upload file to MinIO
  async uploadFile(
    bucketName: string,
    file: Buffer,
    fileName: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const objectName = `${uuidv4()}-${fileName}`;
      
      await minioClient.putObject(bucketName, objectName, file, file.length, {
        'Content-Type': contentType,
        ...metadata,
      });

      return objectName;
    } catch (error) {
      console.error('MinIO upload error:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  // Get presigned URL for file access
  async getPresignedUrl(bucketName: string, objectName: string, expirySeconds: number = 86400): Promise<string> {
    try {
      return await minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
    } catch (error) {
      console.error('MinIO presigned URL error:', error);
      throw new Error('Failed to generate file URL');
    }
  }

  // Delete file from MinIO
  async deleteFile(bucketName: string, objectName: string): Promise<void> {
    try {
      await minioClient.removeObject(bucketName, objectName);
    } catch (error) {
      console.error('MinIO delete error:', error);
      throw new Error('Failed to delete file from storage');
    }
  }

  // Upload audio file
  async uploadAudio(file: Buffer, fileName: string, userId: string): Promise<string> {
    const objectName = await this.uploadFile(
      BUCKETS.AUDIO,
      file,
      fileName,
      'audio/webm',
      { userId }
    );
    return `${BUCKETS.AUDIO}/${objectName}`;
  }

  // Get file URL
  async getFileUrl(filePathWithBucket: string): Promise<string> {
    const [bucketName, ...objectNameParts] = filePathWithBucket.split('/');
    const objectName = objectNameParts.join('/');
    return await this.getPresignedUrl(bucketName, objectName);
  }

  // Delete file by full path
  async deleteFileByPath(filePathWithBucket: string): Promise<void> {
    const [bucketName, ...objectNameParts] = filePathWithBucket.split('/');
    const objectName = objectNameParts.join('/');
    await this.deleteFile(bucketName, objectName);
  }

  // List files in bucket
  async listFiles(bucketName: string, prefix?: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const files: string[] = [];
      const stream = minioClient.listObjects(bucketName, prefix, true);

      stream.on('data', (obj) => {
        if (obj.name) {
          files.push(obj.name);
        }
      });

      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(files));
    });
  }
}

export default new StorageService();

import minioClient, { MINIO_CONFIG } from '../../core/config/minio';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class FileService {
  private readonly AVATAR_BUCKET = MINIO_CONFIG.BUCKETS.AVATARS;
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  async uploadAvatar(file: Express.Multer.File, userId: string): Promise<string> {
   
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit.');
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${userId}-${uuidv4()}${fileExtension}`;
    const objectKey = `avatars/${fileName}`;

    try {
      // MinIO Client API - putObject method
      await minioClient.putObject(
        this.AVATAR_BUCKET,
        objectKey,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'user-id': userId,
          'original-name': file.originalname,
        }
      );

      // Trả về path tương đối: /user-avatars/avatars/xxx.jpg
      return `/${this.AVATAR_BUCKET}/${objectKey}`;
    } catch (error) {
      console.error('Error uploading avatar to MinIO:', error);
      throw new Error('Failed to upload avatar');
    }
  }

  async deleteAvatar(avatarUrl: string): Promise<void> {
    try {
      // avatarUrl format: /user-avatars/avatars/xxx.jpg
      const objectKey = avatarUrl.replace(`/${this.AVATAR_BUCKET}/`, '');

      // MinIO Client API - removeObject method
      await minioClient.removeObject(this.AVATAR_BUCKET, objectKey);
    } catch (error) {
      console.error('Error deleting avatar from MinIO:', error);
    }
  }

  async getAvatar(avatarPath: string): Promise<{ stream: any; contentType: string; size: number }> {
    try {
      // avatarPath format: /user-avatars/avatars/xxx.jpg
      const objectKey = avatarPath.replace(`/${this.AVATAR_BUCKET}/`, '');

      // Get file stream từ MinIO
      const stream = await minioClient.getObject(this.AVATAR_BUCKET, objectKey);
      
      // Get file metadata
      const stat = await minioClient.statObject(this.AVATAR_BUCKET, objectKey);

      return {
        stream,
        contentType: stat.metaData['content-type'] || 'image/jpeg',
        size: stat.size,
      };
    } catch (error) {
      console.error('Error getting avatar from MinIO:', error);
      throw new Error('Failed to get avatar');
    }
  }

  /**
   * Get file from MinIO (generic - supports any bucket)
   * @param filePath - Format: /bucket-name/object-name.ext
   */
  async getFile(filePath: string): Promise<{ stream: any; contentType: string; size: number }> {
    try {
      // Parse filePath: /template-files/uuid-filename.jpg -> bucket: template-files, object: uuid-filename.jpg
      const pathParts = filePath.split('/').filter(p => p);
      if (pathParts.length < 2) {
        throw new Error('Invalid file path format');
      }

      const bucketName = pathParts[0];
      const objectKey = pathParts.slice(1).join('/');

      console.log(`[FileService] Getting file from bucket: ${bucketName}, object: ${objectKey}`);

      // Get file stream from MinIO
      const stream = await minioClient.getObject(bucketName, objectKey);
      
      // Get file metadata
      const stat = await minioClient.statObject(bucketName, objectKey);

      return {
        stream,
        contentType: stat.metaData['content-type'] || 'application/octet-stream',
        size: stat.size,
      };
    } catch (error) {
      console.error('Error getting file from MinIO:', error);
      throw new Error('Failed to get file');
    }
  }
}

export default new FileService();

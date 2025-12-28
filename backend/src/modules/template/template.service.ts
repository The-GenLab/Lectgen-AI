import { v4 as uuidv4 } from 'uuid';
import TemplateFile from '../../core/models/TemplateFile';
import { storageService } from '../storage';
import sharp from 'sharp';

interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    size: number;
    mimetype: string;
}

class TemplateService {
    /**
     * Upload template file (image or document) to MinIO
     */
    async uploadTemplate(
        file: UploadedFile,
        userId: string,
        conversationId?: string
    ) {
        // Determine file type and validate
        const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const documentMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        let fileType: 'image' | 'document';
        let bucketName: string;
        let maxSize: number;

        if (imageMimeTypes.includes(file.mimetype)) {
            fileType = 'image';
            bucketName = 'template-files';
            maxSize = 5 * 1024 * 1024; // 5MB for images
        } else if (documentMimeTypes.includes(file.mimetype)) {
            fileType = 'document';
            bucketName = 'template-files';
            maxSize = 10 * 1024 * 1024; // 10MB for documents
        } else {
            throw new Error('Invalid file type. Only images (JPG, PNG) and documents (PDF, DOCX, TXT) are allowed');
        }

        // Validate file size
        if (file.size > maxSize) {
            throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
        }

        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;

        // Upload to MinIO
        const objectName = await storageService.uploadFile(
            bucketName,
            file.buffer,
            uniqueFileName,
            file.mimetype
        );

        // Save relative path instead of presigned URL (permanent)
        // Format: /template-files/uuid-filename.jpg
        const fileUrl = `/${bucketName}/${objectName}`;

        // save to database
        const templateFile = await TemplateFile.create({
            userId,
            conversationId,
            fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            fileType,
            analyzed: false,
        });

        return templateFile;
    }

    /**
     * Get templates with filters
     */
    async getTemplates(filter: {
        userId: string;
        analyzed?: boolean;
        conversationId?: string;
    }) {
        const templates = await TemplateFile.findAll({
            where: filter,
            order: [['createdAt', 'DESC']],
        });

        return templates;
    }

    /**
     * Get template by ID (with user ownership check)
     */
    async getTemplateById(id: string, userId: string) {
        const template = await TemplateFile.findOne({
            where: { id, userId },
        });

        return template;
    }

    /**
     * Delete template
     */
    async deleteTemplate(id: string, userId: string) {
        const template = await this.getTemplateById(id, userId);

        if (!template) {
            throw new Error('Template not found or you do not have permission');
        }

        // Delete from MinIO
        try {
            const fileName = template.fileUrl.split('/').pop();
            if (fileName) {
                await storageService.deleteFile('template-images', fileName);
            }
        } catch (error) {
            console.error('Failed to delete file from MinIO:', error);
            // Continue with database deletion even if MinIO deletion fails
        }

        // Delete from database
        await template.destroy();
    }

    /**
     * Update template analysis result (for Vision Service team)
     */
    async updateAnalysisResult(
        id: string,
        styleData: {
            colors?: string[];
            layoutType?: string;
            fontStyle?: string;
            stylePrompt?: string;
        }
    ) {
        const template = await TemplateFile.findByPk(id);

        if (!template) {
            throw new Error('Template not found');
        }

        template.analyzed = true;
        template.styleData = styleData;
        await template.save();

        return template;
    }

    /**
     * Analyze template image style using image processing
     */
    async analyzeTemplateStyle(imageBuffer: Buffer) {
        try {
            // Use sharp to analyze image
            const image = sharp(imageBuffer);
            const metadata = await image.metadata();
            const stats = await image.stats();

            // Extract dominant colors from stats
            const dominantColors = this.extractDominantColors(stats);

            // Detect layout based on aspect ratio and dimensions
            const layoutType = this.detectLayout(metadata);

            // Detect color scheme
            const colorScheme = this.detectColorScheme(dominantColors);

            // Analyze image complexity
            const complexity = await this.analyzeComplexity(imageBuffer);

            // Analyze contrast and brightness
            const visualMetrics = this.analyzeVisualMetrics(stats);

            // Detect style based on comprehensive analysis
            const styleTraits = this.detectStyleTraits(
                dominantColors,
                colorScheme,
                complexity,
                visualMetrics,
                metadata
            );

            return {
                traits: styleTraits,
                colors: dominantColors,
                layoutType,
                colorScheme,
                complexity,
                visualMetrics,
                dimensions: {
                    width: metadata.width,
                    height: metadata.height
                }
            };
        } catch (error) {
            console.error('Image analysis error:', error);
            throw new Error('Failed to analyze image style');
        }
    }

    /**
     * Extract dominant colors from image statistics
     */
    private extractDominantColors(stats: any): string[] {
        const colors: string[] = [];

        // Get channel means and standard deviations (RGB)
        if (stats.channels && stats.channels.length >= 3) {
            const r = Math.round(stats.channels[0].mean);
            const g = Math.round(stats.channels[1].mean);
            const b = Math.round(stats.channels[2].mean);

            const rStd = stats.channels[0].stdev || 0;
            const gStd = stats.channels[1].stdev || 0;
            const bStd = stats.channels[2].stdev || 0;

            // Convert to hex
            const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');

            // Main color (mean)
            const mainColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            colors.push(mainColor);

            // Add variation colors based on standard deviation
            if (rStd > 30 || gStd > 30 || bStd > 30) {
                // High variation - add lighter and darker variants
                colors.push(`#${toHex(r + rStd)}${toHex(g + gStd)}${toHex(b + bStd)}`);
                colors.push(`#${toHex(r - rStd)}${toHex(g - gStd)}${toHex(b - bStd)}`);
            }

            // Detect brightness and add complementary colors
            const brightness = (r + g + b) / 3;
            const maxChannel = Math.max(r, g, b);
            const minChannel = Math.min(r, g, b);
            const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;

            // Add white if light theme
            if (brightness > 200) {
                colors.push('#FFFFFF');
            }

            // Add black if dark theme
            if (brightness < 80) {
                colors.push('#000000');
            }

            // Add accent colors based on dominant channel
            if (saturation > 0.3) {
                if (r > g && r > b) {
                    colors.push('#FF5252'); // Red accent
                } else if (g > r && g > b) {
                    colors.push('#4CAF50'); // Green accent
                } else if (b > r && b > g) {
                    colors.push('#2196F3'); // Blue accent
                }
            }

            // Add gray if low saturation
            if (saturation < 0.2) {
                const gray = Math.round(brightness);
                colors.push(`#${toHex(gray)}${toHex(gray)}${toHex(gray)}`);
            }
        }

        // Remove duplicates and limit to 6 colors
        return [...new Set(colors)].slice(0, 6);
    }

    /**
     * Detect layout type based on dimensions
     */
    private detectLayout(metadata: any): string {
        if (!metadata.width || !metadata.height) return 'unknown';

        const aspectRatio = metadata.width / metadata.height;

        // Common presentation aspect ratios
        if (Math.abs(aspectRatio - 16 / 9) < 0.1) {
            return '16:9 Widescreen';
        } else if (Math.abs(aspectRatio - 4 / 3) < 0.1) {
            return '4:3 Standard';
        } else if (aspectRatio > 1.5) {
            return 'Wide Layout';
        } else if (aspectRatio < 0.8) {
            return 'Portrait';
        }

        return 'Square';
    }

    /**
     * Detect color scheme from dominant colors
     */
    private detectColorScheme(colors: string[]): string {
        if (colors.length === 0) return 'unknown';

        const hasWhite = colors.some(c => c.toUpperCase() === '#FFFFFF' || c.toUpperCase().startsWith('#F'));
        const hasBlack = colors.some(c => c.toUpperCase() === '#000000' || c.toUpperCase().startsWith('#0'));
        const hasBlue = colors.some(c => {
            const hex = c.toUpperCase();
            return hex.includes('00') && hex.includes('FF') || hex.match(/#[0-9A-F]{2}[5-9A-F]{2}[C-F][0-9A-F]/);
        });

        if (hasBlue && hasWhite) return 'Blue & White';
        if (hasWhite) return 'Light Theme';
        if (hasBlack) return 'Dark Theme';

        return 'Colorful';
    }

    /**
     * Detect style traits based on color analysis
     */
    private detectStyleTraits(
        colors: string[],
        colorScheme: string,
        complexity: any,
        visualMetrics: any,
        metadata: any
    ): Array<{ label: string, icon: string }> {
        const traits: Array<{ label: string, icon: string }> = [];

        // Analyze minimalism based on multiple factors
        const isMinimalist = (
            colors.length <= 3 ||
            colorScheme.includes('Light') ||
            colorScheme.includes('White') ||
            complexity.edgeDensity < 0.15
        );

        if (isMinimalist) {
            traits.push({ label: 'Minimalist', icon: '✨' });
        } else if (complexity.edgeDensity > 0.3) {
            traits.push({ label: 'Detailed', icon: '🔍' });
        }

        // Detect style based on contrast and brightness
        if (visualMetrics.contrast > 60) {
            traits.push({ label: 'High Contrast', icon: '⚡' });
        } else if (visualMetrics.contrast < 30) {
            traits.push({ label: 'Soft Contrast', icon: '🌙' });
        }

        // Detect modern vs classic based on saturation
        if (visualMetrics.saturation > 0.5) {
            traits.push({ label: 'Vibrant', icon: '🌈' });
        } else if (visualMetrics.saturation < 0.2) {
            traits.push({ label: 'Muted', icon: '🎨' });
        }

        // Brightness-based traits
        if (visualMetrics.brightness > 200) {
            traits.push({ label: 'Bright & Airy', icon: '☀️' });
        } else if (visualMetrics.brightness < 80) {
            traits.push({ label: 'Dark & Dramatic', icon: '🌑' });
        }

        // Layout complexity
        if (complexity.edgeDensity > 0.25) {
            traits.push({ label: 'Complex Layout', icon: '📊' });
        } else {
            traits.push({ label: 'Clean Layout', icon: '📐' });
        }

        // Typography hints (based on common patterns)
        if (isMinimalist && visualMetrics.brightness > 150) {
            traits.push({ label: 'Sans-Serif', icon: '🔤' });
        } else if (visualMetrics.contrast > 50) {
            traits.push({ label: 'Bold Typography', icon: '💪' });
        }

        // Professional assessment
        const isProfessional = (
            visualMetrics.contrast > 40 &&
            visualMetrics.saturation < 0.6 &&
            complexity.edgeDensity < 0.3
        );

        if (isProfessional) {
            traits.push({ label: 'Professional', icon: '💼' });
        }

        // Creative assessment
        const isCreative = (
            visualMetrics.saturation > 0.4 ||
            colors.length > 4 ||
            complexity.edgeDensity > 0.3
        );

        if (isCreative) {
            traits.push({ label: 'Creative', icon: '🎭' });
        }

        // Add color scheme as trait
        traits.push({ label: colorScheme, icon: '🎨' });

        // Limit to most relevant traits (max 8)
        return traits.slice(0, 8);
    }

    /**
     * Analyze image complexity using edge detection
     */
    private async analyzeComplexity(imageBuffer: Buffer) {
        try {
            // Convert to grayscale and detect edges
            const edgeImage = await sharp(imageBuffer)
                .grayscale()
                .convolve({
                    width: 3,
                    height: 3,
                    kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] // Edge detection kernel
                })
                .raw()
                .toBuffer({ resolveWithObject: true });

            // Calculate edge density
            const pixels = new Uint8Array(edgeImage.data);
            let edgePixels = 0;
            const threshold = 30;

            for (let i = 0; i < pixels.length; i++) {
                if (pixels[i] > threshold) {
                    edgePixels++;
                }
            }

            const edgeDensity = edgePixels / pixels.length;

            return {
                edgeDensity: Number(edgeDensity.toFixed(3)),
                level: edgeDensity > 0.3 ? 'high' : edgeDensity > 0.15 ? 'medium' : 'low'
            };
        } catch (error) {
            console.error('Complexity analysis error:', error);
            return { edgeDensity: 0, level: 'unknown' };
        }
    }

    /**
     * Analyze visual metrics (contrast, brightness, saturation)
     */
    private analyzeVisualMetrics(stats: any) {
        if (!stats.channels || stats.channels.length < 3) {
            return { contrast: 0, brightness: 0, saturation: 0 };
        }

        const r = stats.channels[0].mean;
        const g = stats.channels[1].mean;
        const b = stats.channels[2].mean;

        const rStd = stats.channels[0].stdev || 0;
        const gStd = stats.channels[1].stdev || 0;
        const bStd = stats.channels[2].stdev || 0;

        // Brightness (average of RGB)
        const brightness = (r + g + b) / 3;

        // Contrast (average standard deviation)
        const contrast = (rStd + gStd + bStd) / 3;

        // Saturation calculation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;

        return {
            brightness: Number(brightness.toFixed(1)),
            contrast: Number(contrast.toFixed(1)),
            saturation: Number(saturation.toFixed(2))
        };
    }
}

export default new TemplateService();

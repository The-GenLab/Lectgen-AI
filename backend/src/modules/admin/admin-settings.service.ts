import SystemSettings from '../../core/models/SystemSettings';
import { QUOTA } from '../../shared/constants';
import { userRepository } from '../../core/repositories';
import { UserRole } from '../../shared/constants';

export interface SystemConfig {
  monthlyFreeQuota: number;
  inputMethods: {
    text: boolean;
    audio: boolean;
    image: boolean;
  };
  vipConfig: {
    priorityQueue: boolean;
    processingMultiplier: number;
  };
  maintenanceMode: boolean;
}

class AdminSettingsService {
  private readonly DEFAULT_CONFIG: SystemConfig = {
    monthlyFreeQuota: QUOTA.FREE_USER_MAX_SLIDES,
    inputMethods: {
      text: true,
      audio: true,
      image: true,
    },
    vipConfig: {
      priorityQueue: true,
      processingMultiplier: 2.0,
    },
    maintenanceMode: false,
  };

  /**
   * Get system settings
   */
  async getSettings(): Promise<SystemConfig> {
    try {
      const settings = await SystemSettings.findAll();
      const config: Partial<SystemConfig> = {};

      settings.forEach(setting => {
        try {
          const parsed = JSON.parse(setting.value);
          config[setting.key as keyof SystemConfig] = parsed;
        } catch {
          // If parsing fails, use raw value
          config[setting.key as keyof SystemConfig] = setting.value as any;
        }
      });

      // Merge with defaults
      return {
        ...this.DEFAULT_CONFIG,
        ...config,
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return this.DEFAULT_CONFIG;
    }
  }

  /**
   * Update system settings
   */
  async updateSettings(updates: Partial<SystemConfig>): Promise<SystemConfig> {
    try {
      for (const [key, value] of Object.entries(updates)) {
        const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        
        await SystemSettings.upsert({
          key,
          value: valueStr,
          description: this.getDescription(key),
        });
      }

      // If monthlyFreeQuota was updated, update all FREE users
      if (updates.monthlyFreeQuota !== undefined) {
        await this.updateAllFreeUsersQuota(updates.monthlyFreeQuota);
      }

      return await this.getSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
  }

  /**
   * Update maxSlidesPerMonth for all FREE users
   */
  private async updateAllFreeUsersQuota(newQuota: number): Promise<void> {
    try {
      const freeUsers = await userRepository.findByRole(UserRole.FREE);
      for (const user of freeUsers) {
        await userRepository.update(user.id, { maxSlidesPerMonth: newQuota });
      }
      console.log(`✅ Updated quota for ${freeUsers.length} FREE users to ${newQuota}`);
    } catch (error) {
      console.error('Error updating FREE users quota:', error);
      // Don't throw - settings update should still succeed
    }
  }

  /**
   * Get monthly free quota from settings (for creating new users)
   */
  async getMonthlyFreeQuota(): Promise<number> {
    try {
      const settings = await this.getSettings();
      return settings.monthlyFreeQuota;
    } catch (error) {
      console.error('Error getting monthly free quota, using default:', error);
      return QUOTA.FREE_USER_MAX_SLIDES;
    }
  }

  /**
   * Get input methods settings (public API for frontend)
   */
  async getInputMethods(): Promise<{ text: boolean; audio: boolean; image: boolean }> {
    try {
      const settings = await this.getSettings();
      return settings.inputMethods;
    } catch (error) {
      console.error('Error getting input methods, using defaults:', error);
      return {
        text: true,
        audio: true,
        image: true,
      };
    }
  }

  /**
   * Get maintenance mode status (public API for frontend)
   */
  async getMaintenanceMode(): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      return settings.maintenanceMode;
    } catch (error) {
      console.error('Error getting maintenance mode, using default:', error);
      return false;
    }
  }

  /**
   * Get description for a setting key
   */
  private getDescription(key: string): string {
    const descriptions: Record<string, string> = {
      monthlyFreeQuota: 'Maximum number of slides free users can generate per month',
      inputMethods: 'Enabled input methods for users',
      vipConfig: 'VIP user configuration',
      maintenanceMode: 'System maintenance mode status',
    };
    return descriptions[key] || '';
  }

  /**
   * Initialize default settings if they don't exist
   */
  async initializeDefaults(): Promise<void> {
    try {
      const existing = await SystemSettings.findAll();
      const existingKeys = new Set(existing.map(s => s.key));

      const defaultEntries = Object.entries(this.DEFAULT_CONFIG);
      for (const [key, value] of defaultEntries) {
        if (!existingKeys.has(key)) {
          await SystemSettings.create({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            description: this.getDescription(key),
          });
        }
      }
    } catch (error) {
      console.error('Error initializing default settings:', error);
    }
  }
}

export default new AdminSettingsService();


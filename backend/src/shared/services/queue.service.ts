import adminSettingsService from '../../modules/admin/admin-settings.service';
import { UserRole } from '../constants';

interface QueueItem {
  id: string;
  userId: string;
  userRole: UserRole;
  priority: number; // Higher number = higher priority
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  createdAt: Date;
}

/**
 * Simple Priority Queue Service
 * Handles request queuing with priority based on user role and VIP config
 */
class QueueService {
  private queue: QueueItem[] = [];
  private processing = false;
  private maxConcurrent = 3; // Max concurrent AI generations

  /**
   * Add item to queue with priority
   */
  async enqueue<T>(params: {
    userId: string;
    userRole: UserRole;
    execute: () => Promise<T>;
  }): Promise<T> {
    const { userId, userRole, execute } = params;
    return new Promise<T>(async (resolve, reject) => {
      try {
        // Get VIP config to determine priority
        const settings = await adminSettingsService.getSettings();
        const { priorityQueue, processingMultiplier } = settings.vipConfig;

        // Calculate priority
        let priority = 0; // Default for FREE users
        
        if (userRole === UserRole.VIP || userRole === UserRole.ADMIN) {
          // VIP/ADMIN users get higher priority if priorityQueue is enabled
          if (priorityQueue) {
            // Priority = multiplier * 1000 (higher multiplier = higher priority)
            priority = processingMultiplier * 1000;
          } else {
            // If priority queue is disabled, all users have same priority
            priority = 1;
          }
        } else {
          // FREE users always have priority 0 (lowest)
          priority = 0;
        }

        // Add timestamp for FIFO within same priority
        const item: QueueItem = {
          id: `${Date.now()}-${Math.random()}`,
          userId: params.userId,
          userRole: params.userRole,
          priority,
          execute: params.execute,
          resolve,
          reject,
          createdAt: new Date(),
        };

        // Insert item in priority order (higher priority first)
        this.insertByPriority(item);
        
        console.log(`[QueueService] Enqueued request for user ${params.userId} with priority ${priority}`);
        
        // Start processing if not already processing
        if (!this.processing) {
          this.processQueue();
        }
      } catch (error) {
        reject(error as Error);
      }
    });
  }

  /**
   * Insert item into queue maintaining priority order
   */
  private insertByPriority(item: QueueItem): void {
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (item.priority > this.queue[i].priority) {
        this.queue.splice(i, 0, item);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.queue.push(item);
    }
  }

  /**
   * Process queue (concurrent processing with maxConcurrent limit)
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const activeTasks: Promise<void>[] = [];

    while (this.queue.length > 0 || activeTasks.length > 0) {
      // Start new tasks up to maxConcurrent
      while (activeTasks.length < this.maxConcurrent && this.queue.length > 0) {
        const item = this.queue.shift();
        if (!item) break;

        const task = this.executeItem(item);
        activeTasks.push(task);

        // Remove completed tasks
        task.finally(() => {
          const index = activeTasks.indexOf(task);
          if (index > -1) {
            activeTasks.splice(index, 1);
          }
        });
      }

      // Wait a bit before checking again
      if (activeTasks.length >= this.maxConcurrent || this.queue.length === 0) {
        await Promise.race(activeTasks).catch(() => {});
      }
    }

    this.processing = false;
  }

  /**
   * Execute a queue item
   */
  private async executeItem(item: QueueItem): Promise<void> {
    try {
      console.log(`[QueueService] Processing request ${item.id} for user ${item.userId} (priority: ${item.priority})`);
      const result = await item.execute();
      item.resolve(result);
    } catch (error) {
      item.reject(error as Error);
    }
  }

  /**
   * Get queue status (for monitoring)
   */
  getQueueStatus(): { length: number; processing: boolean } {
    return {
      length: this.queue.length,
      processing: this.processing,
    };
  }

  /**
   * Clear queue (for testing/admin)
   */
  clearQueue(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

export default new QueueService();


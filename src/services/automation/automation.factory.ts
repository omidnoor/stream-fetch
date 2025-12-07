/**
 * Automation Factory
 * Provides singleton instance of AutomationService
 */

import { AutomationService } from './automation.service';
import { getYouTubeService } from '@/services/youtube/youtube.factory';

let instance: AutomationService | null = null;

/**
 * Get singleton instance of AutomationService
 */
export function getAutomationService(): AutomationService {
  if (!instance) {
    const youtubeService = getYouTubeService();
    instance = new AutomationService(youtubeService);
  }
  return instance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetAutomationService(): void {
  instance = null;
}

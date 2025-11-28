import { SetMetadata } from '@nestjs/common';

export const CHECK_FEATURE_KEY = 'check_feature';

/**
 * Decorator to check if user's plan has a specific feature enabled
 * 
 * @param featureName - The feature name from PlanFeatures (e.g., 'fineTuning', 'advancedWorkflows')
 * 
 * @example
 * @CheckFeature('fineTuning')
 * @Post('fine-tuning/jobs')
 * async createFineTuningJob() { ... }
 */
export const CheckFeature = (featureName: string) => SetMetadata(CHECK_FEATURE_KEY, featureName);

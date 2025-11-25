/**
 * Test Fixtures Index
 * Central export for all test fixtures and mock data
 */

export * from './mock-data';
export * from './mock-workflows';
export * from './mock-scenarios';
export * from './seed-data';
export * from './mock-api-responses';

// Re-export commonly used items for convenience
import { mockData, generators } from './mock-data';
import { mockWorkflows } from './mock-workflows';
import { mockScenarios, scenarioHelpers } from './mock-scenarios';
import { SeedDataGenerator, quickSeed, DatabaseSeeder } from './seed-data';

export const fixtures = {
  data: mockData,
  workflows: mockWorkflows,
  scenarios: mockScenarios,
  generators,
  scenarioHelpers,
  seedGenerator: SeedDataGenerator,
  quickSeed,
  databaseSeeder: DatabaseSeeder,
};

// Default export for easy importing
export default fixtures;

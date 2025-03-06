/**
 * Bun configuration to resolve dependency conflicts
 * between canvas and jest-environment-jsdom
 */
export default {
  // Tell Bun to ignore peer dependency warnings for specific packages
  dependencies: {
    // Ignore peer dependency warnings for canvas
    "canvas": {
      ignorePeerDependencies: true
    },
    // Ignore peer dependency warnings for jest-environment-jsdom
    "jest-environment-jsdom": {
      ignorePeerDependencies: true
    }
  },
  // Configure tests to avoid dependency conflicts
  test: {
    // Exclude canvas from being loaded during tests
    exclude: ['node_modules/canvas/**'],
    // Configure environment for tests
    environment: "jsdom",
    // Use setup file for tests
    setupFiles: ["jest.setup.ts"]
  }
};
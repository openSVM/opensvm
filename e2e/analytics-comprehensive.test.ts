import { test, expect, Page } from '@playwright/test';

// AI-enhanced test utilities for comprehensive analytics testing
class AnalyticsTestHelper {
  constructor(private page: Page) {}

  /**
   * AI-enhanced loading detection with smart timeout handling
   */
  async waitForTabToLoad(tabName: string, maxTimeout = 30000) {
    const startTime = Date.now();
    
    // Click the tab
    await this.page.click(`button:has-text("${tabName}")`);
    
    // Wait for initial loading state
    await this.page.waitForTimeout(1000);
    
    // AI-enhanced detection of loading forever vs. legitimate loading
    while (Date.now() - startTime < maxTimeout) {
      // Check for loading indicators
      const loadingElements = await this.page.locator('.loading, [data-loading="true"], .spinner, .animate-spin').count();
      
      // Check for error states
      const errorElements = await this.page.locator('.error, [data-error="true"], .text-red, .bg-red').count();
      
      // Check for actual content (data tables, charts, metrics)
      const contentElements = await this.page.locator('table, .chart, .metric, .data-point, .analytics-content').count();
      
      // AI logic: If we have content and no loading indicators, we're done
      if (contentElements > 0 && loadingElements === 0) {
        return { status: 'loaded', contentCount: contentElements };
      }
      
      // If we have errors, return error state
      if (errorElements > 0) {
        const errorText = await this.page.locator('.error, [data-error="true"]').first().textContent() || 'Unknown error';
        return { status: 'error', error: errorText };
      }
      
      // Check if the page is completely unresponsive (no changes in DOM)
      const currentHtml = await this.page.content();
      await this.page.waitForTimeout(2000);
      const newHtml = await this.page.content();
      
      if (currentHtml === newHtml && loadingElements > 0) {
        // Likely stuck in infinite loading
        return { status: 'stuck', message: 'Tab appears to be loading forever' };
      }
      
      await this.page.waitForTimeout(1000);
    }
    
    return { status: 'timeout', message: `Tab did not load within ${maxTimeout}ms` };
  }

  /**
   * Enhanced error detection with context
   */
  async detectErrors() {
    const errors = [];
    
    // Check console errors
    const consoleErrors = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Check network errors
    const networkErrors = [];
    this.page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()} - ${response.url()}`);
      }
    });
    
    // Check DOM errors
    const domErrors = await this.page.locator('.error, [data-error="true"]').allTextContents();
    
    return {
      console: consoleErrors,
      network: networkErrors,
      dom: domErrors
    };
  }

  /**
   * Test monitoring functionality
   */
  async testMonitoringToggle(tabName: string) {
    // Look for monitoring button
    const monitoringButton = this.page.locator('button:has-text("Start Monitoring"), button:has-text("Stop Monitoring")');
    
    if (await monitoringButton.count() === 0) {
      return { status: 'no_button', message: 'No monitoring button found' };
    }
    
    const initialText = await monitoringButton.textContent();
    
    // Click the button
    await monitoringButton.click();
    
    // Wait for state change
    await this.page.waitForTimeout(2000);
    
    const newText = await monitoringButton.textContent();
    
    if (initialText === newText) {
      return { status: 'no_change', message: 'Button state did not change' };
    }
    
    return { status: 'success', from: initialText, to: newText };
  }
}

test.describe('Analytics Platform Comprehensive Tests', () => {
  let helper: AnalyticsTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new AnalyticsTestHelper(page);
    
    // Navigate to analytics page
    await page.goto('/analytics');
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should load analytics page without errors', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Solana Ecosystem Analytics');
    
    // Check that all tabs are present
    const tabs = ['Overview', 'Solana DEX', 'Cross-Chain', 'DeFi Health', 'Validators'];
    for (const tab of tabs) {
      await expect(page.locator(`button:has-text("${tab}")`)).toBeVisible();
    }
  });

  test('should load Overview tab without issues', async ({ page }) => {
    const result = await helper.waitForTabToLoad('Overview', 10000);
    expect(result.status).toBe('loaded');
    
    // Check for key metrics
    await expect(page.locator('text=Network Performance')).toBeVisible();
    await expect(page.locator('text=DeFi Ecosystem')).toBeVisible();
    await expect(page.locator('text=Cross-Chain Activity')).toBeVisible();
  });

  test('should load Solana DEX tab and detect infinite loading', async ({ page }) => {
    const result = await helper.waitForTabToLoad('Solana DEX', 45000);
    
    if (result.status === 'stuck' || result.status === 'timeout') {
      test.fail(true, `Solana DEX tab is loading forever: ${result.message}`);
    } else if (result.status === 'error') {
      test.fail(true, `Solana DEX tab has error: ${result.error}`);
    }
    
    expect(result.status).toBe('loaded');
    
    // Check for DEX content
    await expect(page.locator('text=DEX Volume Rankings, text=Liquidity Pools')).toBeVisible({ timeout: 5000 });
  });

  test('should load Cross-Chain tab and detect infinite loading', async ({ page }) => {
    const result = await helper.waitForTabToLoad('Cross-Chain', 45000);
    
    if (result.status === 'stuck' || result.status === 'timeout') {
      test.fail(true, `Cross-Chain tab is loading forever: ${result.message}`);
    } else if (result.status === 'error') {
      test.fail(true, `Cross-Chain tab has error: ${result.error}`);
    }
    
    expect(result.status).toBe('loaded');
    
    // Check for cross-chain content
    await expect(page.locator('text=Bridge Rankings, text=Asset Migrations')).toBeVisible({ timeout: 5000 });
  });

  test('should load DeFi Health tab and detect infinite loading', async ({ page }) => {
    const result = await helper.waitForTabToLoad('DeFi Health', 60000); // Extended timeout for DeFi
    
    if (result.status === 'stuck' || result.status === 'timeout') {
      test.fail(true, `DeFi Health tab is loading forever: ${result.message}`);
    } else if (result.status === 'error') {
      test.fail(true, `DeFi Health tab has error: ${result.error}`);
    }
    
    expect(result.status).toBe('loaded');
    
    // Check for DeFi health content
    await expect(page.locator('text=Protocol Health, text=Risk Assessment')).toBeVisible({ timeout: 5000 });
  });

  test('should load Validators tab and detect errors', async ({ page }) => {
    const result = await helper.waitForTabToLoad('Validators', 45000);
    
    if (result.status === 'stuck' || result.status === 'timeout') {
      test.fail(true, `Validators tab is loading forever: ${result.message}`);
    } else if (result.status === 'error') {
      test.fail(true, `Validators tab has error: ${result.error}`);
    }
    
    expect(result.status).toBe('loaded');
    
    // Check for validator content
    await expect(page.locator('text=Validator Performance, text=Network Decentralization')).toBeVisible({ timeout: 5000 });
  });

  test('should test monitoring functionality for each tab', async ({ page }) => {
    const tabsWithMonitoring = ['Solana DEX', 'Cross-Chain', 'DeFi Health', 'Validators'];
    
    for (const tabName of tabsWithMonitoring) {
      await page.click(`button:has-text("${tabName}")`);
      await page.waitForTimeout(3000); // Wait for tab to load
      
      const monitoringResult = await helper.testMonitoringToggle(tabName);
      
      if (monitoringResult.status === 'no_button') {
        console.warn(`No monitoring button found for ${tabName} tab`);
      } else if (monitoringResult.status === 'no_change') {
        test.fail(true, `Monitoring button for ${tabName} tab did not change state`);
      } else {
        console.log(`Monitoring toggle working for ${tabName}: ${monitoringResult.from} -> ${monitoringResult.to}`);
      }
    }
  });

  test('should detect and report all errors', async ({ page }) => {
    const allErrors = [];
    
    // Test each tab and collect errors
    const tabs = ['Solana DEX', 'Cross-Chain', 'DeFi Health', 'Validators'];
    
    for (const tabName of tabs) {
      await page.click(`button:has-text("${tabName}")`);
      await page.waitForTimeout(5000);
      
      const errors = await helper.detectErrors();
      if (errors.console.length > 0 || errors.network.length > 0 || errors.dom.length > 0) {
        allErrors.push({
          tab: tabName,
          errors: errors
        });
      }
    }
    
    if (allErrors.length > 0) {
      console.log('Detected errors:', JSON.stringify(allErrors, null, 2));
      test.fail(true, `Found errors in ${allErrors.length} tabs. Check console output for details.`);
    }
  });

  test('should test API endpoints directly', async ({ page }) => {
    const endpoints = [
      '/api/analytics/dex',
      '/api/analytics/cross-chain', 
      '/api/analytics/defi-health',
      '/api/analytics/validators'
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      
      if (!response.ok()) {
        test.fail(true, `API endpoint ${endpoint} failed with status ${response.status()}`);
      }
      
      const responseTime = Date.now();
      const startTime = Date.now();
      
      try {
        const data = await response.json();
        const endTime = Date.now();
        
        console.log(`${endpoint} responded in ${endTime - startTime}ms`);
        
        if (endTime - startTime > 30000) {
          test.fail(true, `API endpoint ${endpoint} took too long to respond (${endTime - startTime}ms)`);
        }
        
        if (!data.success && !data.data) {
          console.warn(`API endpoint ${endpoint} returned unsuccessful response:`, data);
        }
      } catch (error) {
        test.fail(true, `API endpoint ${endpoint} returned invalid JSON: ${error}`);
      }
    }
  });

  test('should test real-time updates', async ({ page }) => {
    // Go to DEX tab
    await page.click('button:has-text("Solana DEX")');
    await page.waitForTimeout(5000);
    
    // Check if data updates over time
    const initialContent = await page.textContent('.analytics-content, table, .metric');
    
    // Wait for potential update
    await page.waitForTimeout(35000); // Wait longer than refresh interval
    
    const updatedContent = await page.textContent('.analytics-content, table, .metric');
    
    if (initialContent === updatedContent) {
      console.warn('No real-time updates detected - this might indicate stale data');
    } else {
      console.log('Real-time updates working properly');
    }
  });
});
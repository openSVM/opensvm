import { test, expect, Page, Locator } from '@playwright/test';

// Test address from the task
const TEST_ADDRESS = 'DtdSSG8ZJRZVv5Jx7K1MeWp7Zxcu19GD5wQRGRpQ9uMF';

async function waitForTableLoad(page: Page) {
  // Wait for loading spinner to appear and disappear
  try {
    // Wait for either the table content or an error message
    await Promise.race([
      page.waitForSelector('.vtable [role="row"]', { state: 'attached', timeout: 10000 }),
      page.waitForSelector('.text-red-400', { state: 'attached', timeout: 10000 })
    ]);
  } catch (error) {
    console.log('Timeout waiting for table content or error message');
  }
}

async function getTableRows(page: Page): Promise<Locator[]> {
  return page.locator('.vtable [role="row"]').all();
}

test.describe('TransfersTable Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page with the component
    await page.goto(`/test/transfers?address=${TEST_ADDRESS}`);
    await page.waitForLoadState('networkidle');
  });

  test('displays transfer data correctly', async ({ page }) => {
    // Verify table headers
    const expectedHeaders = ['Tx ID', 'Date', 'From', 'To', 'Token', 'Amount', 'USD Value', 'Current USD', 'Type'];
    for (const header of expectedHeaders) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }

    // Verify data rows
    const rows = await getTableRows(page);
    expect(rows.length).toBeGreaterThan(0);

    // Check first row data format
    const firstRow = rows[0];
    await expect(firstRow.locator('a[href^="/tx/"]')).toBeVisible(); // Tx ID
    await expect(firstRow.locator('text=/\\d{2} [A-Za-z]{3} \\d{4}/)')).toBeVisible(); // Date
    await expect(firstRow.locator('a[href^="/account/"]')).toBeVisible(); // From/To
    await expect(firstRow.locator('text=/[0-9.]+/')).toBeVisible(); // Amount
  });

  test('implements infinite scroll pagination', async ({ page }) => {
    // Get initial row count
    const initialRows = await getTableRows(page);
    const initialCount = initialRows.length;

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await waitForTableLoad(page);

    // Verify more rows loaded
    const newRows = await getTableRows(page);
    expect(newRows.length).toBeGreaterThan(initialCount);
  });

  test('implements sorting functionality', async ({ page }) => {
    // Test date sorting
    await page.getByRole('columnheader', { name: 'Date' }).click();
    await waitForTableLoad(page);
    
    // Get dates after sorting
    const dates = await page.$$eval('.vtable [role="row"]', rows => 
      rows.map(row => row.querySelector('td:nth-child(2)')?.textContent)
    );

    // Verify dates are sorted
    const sortedDates = [...dates].sort((a, b) => 
      new Date(b || '').getTime() - new Date(a || '').getTime()
    );
    expect(dates).toEqual(sortedDates);
  });

  test('handles error states gracefully', async ({ page }) => {
    // Test invalid address
    await page.goto('/test/transfers?address=invalid');
    await expect(page.getByText('Invalid Solana address')).toBeVisible();

    // Test network error (need to simulate offline)
    await page.route('**/api/account-transfers/**', route => route.abort());
    await page.goto(`/test/transfers?address=${TEST_ADDRESS}`);
    await expect(page.getByText('Failed to load transfers')).toBeVisible();
  });

  test('is responsive across different viewport sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.vtable')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.vtable')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('.vtable')).toBeVisible();
  });

  test('meets accessibility requirements', async ({ page }) => {
    // Check semantic structure
    await expect(page.locator('[role="table"]')).toBeVisible();
    await expect(page.locator('[role="row"]')).toBeVisible();
    await expect(page.locator('[role="columnheader"]')).toBeVisible();
    await expect(page.locator('[role="cell"]')).toBeVisible();

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Check color contrast (requires manual verification)
    // Check ARIA labels
    await expect(page.locator('.vtable')).toHaveAttribute('aria-label', /transfers/i);
  });

  test('performs within acceptable metrics', async ({ page }) => {
    // Test initial load time
    const startTime = Date.now();
    await page.goto(`/test/transfers?address=${TEST_ADDRESS}`);
    await waitForTableLoad(page);
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // 2s threshold

    // Test scroll performance
    const scrollMetrics = await page.evaluate(async () => {
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        window.scrollBy(0, 100);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return performance.now() - start;
    });
    expect(scrollMetrics / 10).toBeLessThan(16.67); // 60fps = 16.67ms per frame

    // Test performance metrics
    const performanceEntries = await page.evaluate(() => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (!navEntry) return [{ loadTime: 0, domContentLoaded: 0, firstPaint: 0 }];
      return [{
        loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
        domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
        firstPaint: navEntry.responseEnd - navEntry.requestStart
      }];
    });

    expect(performanceEntries[0].loadTime).toBeLessThan(2000);
    expect(performanceEntries[0].domContentLoaded).toBeLessThan(1000);
    expect(performanceEntries[0].firstPaint).toBeLessThan(1000);
  });

  test('handles edge cases correctly', async ({ page }) => {
    // Test extremely long content
    await page.evaluate(() => {
      const cell = document.querySelector('.vtable [role="cell"]');
      if (cell) cell.textContent = 'a'.repeat(1000);
    });
    await expect(page.locator('.vtable [role="cell"]')).toBeVisible();

    // Test special characters
    await page.evaluate(() => {
      const cell = document.querySelector('.vtable [role="cell"]');
      if (cell) cell.textContent = '!@#$%^&*()_+<>?:"{}|';
    });
    await expect(page.locator('.vtable [role="cell"]')).toBeVisible();

    // Test empty state
    await page.route('**/api/account-transfers/**', route => 
      route.fulfill({ json: { transfers: [], hasMore: false } })
    );
    await page.reload();
    await expect(page.getByText('No transfers found for this account')).toBeVisible();
  });
});
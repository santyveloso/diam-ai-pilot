import { test, expect } from '@playwright/test';

test('header should be fixed at the top with no margin', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  
  // Get the header element
  const header = page.locator('.app-header');
  
  // Check if header exists
  await expect(header).toBeVisible();
  
  // Get the header's bounding box
  const headerBoundingBox = await header.boundingBox();
  
  // Check if header is at the top of the page (y position should be 0)
  if (headerBoundingBox) {
    console.log('Header position:', headerBoundingBox);
    console.log('Header top position:', headerBoundingBox.y);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'screenshots/header-position.png' });
    
    // Check if the header is properly fixed
    const headerComputedStyle = await page.evaluate(() => {
      const header = document.querySelector('.app-header') as HTMLElement;
      const computedStyle = window.getComputedStyle(header);
      return {
        position: computedStyle.position,
        top: computedStyle.top,
        left: computedStyle.left,
        right: computedStyle.right,
        marginTop: computedStyle.marginTop,
        paddingTop: computedStyle.paddingTop,
        borderTop: computedStyle.borderTop,
        transform: computedStyle.transform
      };
    });
    
    console.log('Header computed styles:', headerComputedStyle);
    
    // Scroll down to verify it's fixed
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Get the header's new position after scrolling
    const headerBoundingBoxAfterScroll = await header.boundingBox();
    console.log('Header position after scroll:', headerBoundingBoxAfterScroll);
    
    // Take another screenshot after scrolling
    await page.screenshot({ path: 'screenshots/header-position-after-scroll.png' });
  }
  
  // Check for any elements that might be causing margin
  const bodyComputedStyle = await page.evaluate(() => {
    const computedStyle = window.getComputedStyle(document.body);
    return {
      marginTop: computedStyle.marginTop,
      paddingTop: computedStyle.paddingTop
    };
  });
  
  console.log('Body computed styles:', bodyComputedStyle);
  
  // Check for any elements that might be causing margin above the header
  const appComputedStyle = await page.evaluate(() => {
    const app = document.querySelector('.app') as HTMLElement;
    const computedStyle = window.getComputedStyle(app);
    return {
      marginTop: computedStyle.marginTop,
      paddingTop: computedStyle.paddingTop
    };
  });
  
  console.log('App computed styles:', appComputedStyle);
});
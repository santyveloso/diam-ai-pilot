import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

/**
 * End-to-End tests for complete user workflows
 * These tests simulate real user interactions with the application
 * including file uploads, question submission, and response handling
 */
describe('User Workflow E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  let backendProcess: ChildProcess;
  let frontendProcess: ChildProcess;
  
  const BACKEND_PORT = 3001;
  const FRONTEND_PORT = 3000;
  const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;
  
  const testPdfPath = path.join(__dirname, 'test-e2e.pdf');

  beforeAll(async () => {
    // Create test PDF file
    const pdfContent = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj\n' +
      '<<\n' +
      '/Type /Catalog\n' +
      '/Pages 2 0 R\n' +
      '>>\n' +
      'endobj\n' +
      '2 0 obj\n' +
      '<<\n' +
      '/Type /Pages\n' +
      '/Kids [3 0 R]\n' +
      '/Count 1\n' +
      '>>\n' +
      'endobj\n' +
      '3 0 obj\n' +
      '<<\n' +
      '/Type /Page\n' +
      '/Parent 2 0 R\n' +
      '/MediaBox [0 0 612 792]\n' +
      '/Contents 4 0 R\n' +
      '>>\n' +
      'endobj\n' +
      '4 0 obj\n' +
      '<<\n' +
      '/Length 60\n' +
      '>>\n' +
      'stream\n' +
      'BT\n' +
      '/F1 12 Tf\n' +
      '100 700 Td\n' +
      '(E2E Test Document Content for Testing) Tj\n' +
      'ET\n' +
      'endstream\n' +
      'endobj\n' +
      'xref\n' +
      '0 5\n' +
      '0000000000 65535 f \n' +
      '0000000010 00000 n \n' +
      '0000000079 00000 n \n' +
      '0000000173 00000 n \n' +
      '0000000301 00000 n \n' +
      'trailer\n' +
      '<<\n' +
      '/Size 5\n' +
      '/Root 1 0 R\n' +
      '>>\n' +
      'startxref\n' +
      '396\n' +
      '%%EOF'
    );
    fs.writeFileSync(testPdfPath, pdfContent);

    // Start backend server
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '../../../'),
      env: { ...process.env, PORT: BACKEND_PORT.toString() },
      stdio: 'pipe'
    });

    // Start frontend server
    frontendProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, '../../../../frontend'),
      env: { ...process.env, PORT: FRONTEND_PORT.toString() },
      stdio: 'pipe'
    });

    // Wait for servers to start
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Launch browser
    browser = await puppeteer.launch({
      headless: true, // Set to false for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set viewport for consistent testing
    await page.setViewport({ width: 1280, height: 720 });
    
    // Enable request interception for debugging
    await page.setRequestInterception(false);
  }, 60000);

  afterAll(async () => {
    // Clean up
    if (browser) {
      await browser.close();
    }
    
    if (backendProcess) {
      backendProcess.kill();
    }
    
    if (frontendProcess) {
      frontendProcess.kill();
    }
    
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
  }, 30000);

  describe('Complete User Journey', () => {
    it('should complete the full user workflow: upload PDF, ask question, receive response', async () => {
      // Navigate to the application
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // Verify page loaded correctly
      await page.waitForSelector('.app-container', { timeout: 10000 });
      
      // Check initial state
      const heading = await page.$eval('h1', el => el.textContent);
      expect(heading).toBe('DIAM AI Pilot');
      
      // Verify initial disabled state
      const questionTextarea = await page.$('textarea[aria-label="Ask a question about your PDF"]');
      expect(questionTextarea).toBeTruthy();
      const isDisabled = await page.evaluate(el => (el as HTMLTextAreaElement).disabled, questionTextarea!);
      expect(isDisabled).toBe(true);
      
      // Upload PDF file
      const fileInput = await page.$('input[type="file"]');
      expect(fileInput).toBeTruthy();
      await fileInput!.uploadFile(testPdfPath);
      
      // Wait for file to be processed and UI to update
      await page.waitForFunction(
        () => {
          const textarea = document.querySelector('textarea[aria-label="Ask a question about your PDF"]') as HTMLTextAreaElement;
          return textarea && !textarea.disabled;
        },
        { timeout: 5000 }
      );
      
      // Verify file was uploaded successfully
      const fileName = await page.$eval('.file-info .file-name', el => el.textContent);
      expect(fileName).toBe('test-e2e.pdf');
      
      // Type question
      const question = 'What is the main content of this document?';
      await page.type('textarea[aria-label="Ask a question about your PDF"]', question);
      
      // Submit question
      const submitButton = await page.$('button[type="submit"]');
      expect(submitButton).toBeTruthy();
      await submitButton!.click();
      
      // Wait for loading state
      await page.waitForSelector('.loading-state', { timeout: 5000 });
      
      // Wait for response (with generous timeout for AI processing)
      await page.waitForSelector('.success-state', { timeout: 45000 });
      
      // Verify response was received
      const responseText = await page.$eval('.formatted-response', el => el.textContent);
      expect(responseText).toBeDefined();
      expect(responseText!.length).toBeGreaterThan(0);
      
      // Verify copy button is present
      const copyButton = await page.$('button[title="Copy response to clipboard"]');
      expect(copyButton).toBeTruthy();
      
    }, 60000);

    it('should handle file upload errors gracefully', async () => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // Create invalid file (text file)
      const invalidFilePath = path.join(__dirname, 'invalid.txt');
      fs.writeFileSync(invalidFilePath, 'This is not a PDF');
      
      try {
        // Try to upload invalid file
        const fileInput = await page.$('input[type="file"]');
        expect(fileInput).toBeTruthy();
        await fileInput!.uploadFile(invalidFilePath);
        
        // Wait for error message
        await page.waitForSelector('.error-message', { timeout: 5000 });
        
        const errorMessage = await page.$eval('.error-message', el => el.textContent);
        expect(errorMessage).toContain('PDF');
        
      } finally {
        // Clean up
        fs.unlinkSync(invalidFilePath);
      }
    }, 30000);

    it('should handle question validation errors', async () => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // Upload valid PDF first
      const fileInput = await page.$('input[type="file"]');
      expect(fileInput).toBeTruthy();
      await fileInput!.uploadFile(testPdfPath);
      
      // Wait for file to be processed
      await page.waitForFunction(
        () => {
          const textarea = document.querySelector('textarea[aria-label="Ask a question about your PDF"]') as HTMLTextAreaElement;
          return textarea && !textarea.disabled;
        },
        { timeout: 5000 }
      );
      
      // Try to submit empty question
      const submitButton = await page.$('button[type="submit"]');
      expect(submitButton).toBeTruthy();
      await submitButton!.click();
      
      // Wait for validation error
      await page.waitForSelector('[role="alert"]', { timeout: 5000 });
      
      const errorMessage = await page.$eval('[role="alert"]', el => el.textContent);
      expect(errorMessage).toContain('question');
      
    }, 30000);
  });

  describe('Responsive Design', () => {
    it('should work correctly on mobile viewport', async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // Verify responsive layout
      const container = await page.$('.app-container');
      expect(container).toBeTruthy();
      const containerStyles = await page.evaluate(el => {
        const styles = window.getComputedStyle(el as Element);
        return {
          padding: styles.padding,
          maxWidth: styles.maxWidth
        };
      }, container!);
      
      // Basic responsive checks
      expect(containerStyles).toBeDefined();
      
      // Test file upload on mobile
      const fileInput = await page.$('input[type="file"]');
      expect(fileInput).toBeTruthy();
      await fileInput!.uploadFile(testPdfPath);
      
      // Verify mobile layout still works
      await page.waitForFunction(
        () => {
          const textarea = document.querySelector('textarea[aria-label="Ask a question about your PDF"]') as HTMLTextAreaElement;
          return textarea && !textarea.disabled;
        },
        { timeout: 5000 }
      );
      
    }, 30000);
  });

  describe('Accessibility', () => {
    it('should be navigable with keyboard only', async () => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // Upload file first
      const fileInput = await page.$('input[type="file"]');
      expect(fileInput).toBeTruthy();
      await fileInput!.uploadFile(testPdfPath);
      
      await page.waitForFunction(
        () => {
          const textarea = document.querySelector('textarea[aria-label="Ask a question about your PDF"]') as HTMLTextAreaElement;
          return textarea && !textarea.disabled;
        },
        { timeout: 5000 }
      );
      
      // Test keyboard navigation
      await page.keyboard.press('Tab'); // Should focus on textarea
      await page.keyboard.type('Test question for accessibility');
      
      await page.keyboard.press('Tab'); // Should focus on submit button
      await page.keyboard.press('Enter'); // Should submit
      
      // Wait for loading state
      await page.waitForSelector('.loading-state', { timeout: 5000 });
      
    }, 45000);

    it('should have proper ARIA labels and roles', async () => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // Check for proper ARIA attributes
      const textarea = await page.$('textarea[aria-label="Ask a question about your PDF"]');
      expect(textarea).toBeTruthy();
      
      const fileUploadArea = await page.$('[role="button"]');
      expect(fileUploadArea).toBeTruthy();
      
      // Upload file and check response area
      const fileInput = await page.$('input[type="file"]');
      expect(fileInput).toBeTruthy();
      await fileInput!.uploadFile(testPdfPath);
      
      await page.waitForFunction(
        () => {
          const textarea = document.querySelector('textarea[aria-label="Ask a question about your PDF"]') as HTMLTextAreaElement;
          return textarea && !textarea.disabled;
        },
        { timeout: 5000 }
      );
      
      await page.type('textarea[aria-label="Ask a question about your PDF"]', 'Accessibility test');
      
      const submitButton = await page.$('button[type="submit"]');
      expect(submitButton).toBeTruthy();
      await submitButton!.click();
      
      // Check for proper ARIA live regions
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      
    }, 45000);
  });

  describe('Error Recovery', () => {
    it('should recover from network errors gracefully', async () => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // Upload file
      const fileInput = await page.$('input[type="file"]');
      expect(fileInput).toBeTruthy();
      await fileInput!.uploadFile(testPdfPath);
      
      await page.waitForFunction(
        () => {
          const textarea = document.querySelector('textarea[aria-label="Ask a question about your PDF"]') as HTMLTextAreaElement;
          return textarea && !textarea.disabled;
        },
        { timeout: 5000 }
      );
      
      // Simulate network failure by intercepting requests
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/ask')) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      // Try to submit question
      await page.type('textarea[aria-label="Ask a question about your PDF"]', 'Test network error');
      
      const submitButton = await page.$('button[type="submit"]');
      expect(submitButton).toBeTruthy();
      await submitButton!.click();
      
      // Wait for error state
      await page.waitForSelector('.error-state', { timeout: 10000 });
      
      const errorMessage = await page.$eval('.error-state .error-message', el => el.textContent);
      expect(errorMessage).toBeDefined();
      
    }, 30000);
  });
});
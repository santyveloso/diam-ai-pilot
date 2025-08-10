import request from "supertest";
import app from "../server";
import fs from "fs";
import path from "path";

describe("Performance Tests", () => {
  const testTimeout = 30000; // 30 seconds

  beforeAll(() => {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  describe("File Upload Performance", () => {
    test(
      "should handle small PDF files (< 1MB) quickly",
      async () => {
        const startTime = Date.now();

        const response = await request(app)
          .post("/api/ask")
          .field("question", "What is this document about?")
          .attach(
            "file",
            Buffer.from(
              "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000206 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n299\n%%EOF"
            ),
            "test.pdf"
          )
          .expect(200);

        const duration = Date.now() - startTime;

        expect(response.body.success).toBe(true);
        expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

        console.log(`Small PDF processing time: ${duration}ms`);
      },
      testTimeout
    );

    test(
      "should handle medium PDF files (1-5MB) within reasonable time",
      async () => {
        // Create a larger PDF content for testing
        const largePdfContent =
          "%PDF-1.4\n" +
          "1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n" +
          "2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n" +
          "3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n" +
          "4 0 obj\n<<\n/Length " +
          (1024 * 1024).toString() +
          "\n>>\nstream\n" +
          "BT\n/F1 12 Tf\n72 720 Td\n" +
          "A".repeat(1024 * 1024 - 50) + // ~1MB of content
          "\nET\nendstream\nendobj\n" +
          "xref\n0 5\n0000000000 65535 f \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n299\n%%EOF";

        const startTime = Date.now();

        const response = await request(app)
          .post("/api/ask")
          .field("question", "Summarize this document")
          .attach("file", Buffer.from(largePdfContent), "large-test.pdf")
          .expect(200);

        const duration = Date.now() - startTime;

        expect(response.body.success).toBe(true);
        expect(duration).toBeLessThan(25000); // Should complete within 25 seconds

        console.log(`Medium PDF processing time: ${duration}ms`);
      },
      testTimeout
    );

    test(
      "should reject files larger than configured limit",
      async () => {
        // Create content larger than 10MB
        const oversizedContent = "A".repeat(11 * 1024 * 1024); // 11MB

        const response = await request(app)
          .post("/api/ask")
          .field("question", "What is this?")
          .attach("file", Buffer.from(oversizedContent), "oversized.pdf")
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("FILE_TOO_LARGE");
      },
      testTimeout
    );
  });

  describe("API Response Performance", () => {
    test("should respond to health check quickly", async () => {
      const startTime = Date.now();

      const response = await request(app).get("/health").expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.status).toBe("OK");
      expect(duration).toBeLessThan(100); // Should be very fast

      console.log(`Health check response time: ${duration}ms`);
    });

    test("should handle concurrent requests", async () => {
      const concurrentRequests = 5;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(request(app).get("/health").expect(200));
      }

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - startTime;

      responses.forEach((response) => {
        expect(response.body.status).toBe("OK");
      });

      expect(duration).toBeLessThan(1000); // All requests should complete within 1 second

      console.log(
        `${concurrentRequests} concurrent requests completed in: ${duration}ms`
      );
    });
  });

  describe("Memory Usage", () => {
    test(
      "should not have significant memory leaks after processing",
      async () => {
        const initialMemory = process.memoryUsage();

        // Process multiple small files
        for (let i = 0; i < 5; i++) {
          await request(app)
            .post("/api/ask")
            .field("question", `Test question ${i}`)
            .attach(
              "file",
              Buffer.from("%PDF-1.4\nTest content"),
              `test-${i}.pdf`
            )
            .expect(200);
        }

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

        console.log(
          `Memory increase after processing: ${(
            memoryIncrease /
            1024 /
            1024
          ).toFixed(2)}MB`
        );

        // Memory increase should be reasonable (less than 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      },
      testTimeout
    );
  });

  describe("Error Handling Performance", () => {
    test("should handle invalid requests quickly", async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post("/api/ask")
        .field("question", "Test question")
        // No file attached - should fail quickly
        .expect(400);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(false);
      expect(duration).toBeLessThan(1000); // Should fail quickly

      console.log(`Invalid request handling time: ${duration}ms`);
    });

    test("should handle malformed PDF files gracefully", async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post("/api/ask")
        .field("question", "What is this?")
        .attach("file", Buffer.from("This is not a PDF file"), "fake.pdf")
        .expect(400);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(false);
      expect(duration).toBeLessThan(5000); // Should handle gracefully within 5 seconds

      console.log(`Malformed PDF handling time: ${duration}ms`);
    });
  });
});

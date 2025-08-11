#!/usr/bin/env node

/**
 * Gemini API Connection Test
 * Tests the Google Gemini API connection and configuration
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../backend/.env" });

async function testGeminiConnection() {
  console.log("🧪 Testing Google Gemini API Connection\n");

  // Check if API key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in environment variables");
    console.log("   Please set your API key in backend/.env file");
    console.log(
      "   Get your API key from: https://makersuite.google.com/app/apikey"
    );
    return false;
  }

  console.log("✅ API Key found:", apiKey.substring(0, 10) + "...");

  try {
    // Initialize the Gemini client
    console.log("\n🔌 Initializing Gemini client...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Test 1: Simple health check
    console.log("🏥 Testing basic connectivity...");
    const result = await model.generateContent(
      'Say "Hello" if you can respond.'
    );
    const response = await result.response;
    const text = response.text();

    if (text && text.trim().length > 0) {
      console.log("✅ Basic connectivity test passed");
      console.log("   Response:", text.trim());
    } else {
      console.log("❌ Basic connectivity test failed - empty response");
      return false;
    }

    // Test 2: More complex request
    console.log("\n🧠 Testing AI generation...");
    const complexResult = await model.generateContent(
      "Explain what artificial intelligence is in one sentence."
    );
    const complexResponse = await complexResult.response;
    const complexText = complexResponse.text();

    if (complexText && complexText.trim().length > 10) {
      console.log("✅ AI generation test passed");
      console.log("   Response length:", complexText.length, "characters");
      console.log("   Sample:", complexText.substring(0, 100) + "...");
    } else {
      console.log("❌ AI generation test failed");
      return false;
    }

    // Test 3: Portuguese language test
    console.log("\n🇧🇷 Testing Portuguese language support...");
    const ptResult = await model.generateContent(
      "Responda em português: O que é inteligência artificial?"
    );
    const ptResponse = await ptResult.response;
    const ptText = ptResponse.text();

    if (ptText && ptText.trim().length > 10) {
      console.log("✅ Portuguese language test passed");
      console.log("   Response length:", ptText.length, "characters");
      console.log("   Sample:", ptText.substring(0, 100) + "...");
    } else {
      console.log("❌ Portuguese language test failed");
      return false;
    }

    console.log("\n🎉 All Gemini API tests passed successfully!");
    return true;
  } catch (error) {
    console.error("\n❌ Gemini API test failed:");

    if (error.message.includes("API_KEY")) {
      console.error("   Issue: Invalid API key");
      console.error("   Solution: Check your API key in backend/.env");
      console.error(
        "   Get a new key: https://makersuite.google.com/app/apikey"
      );
    } else if (
      error.message.includes("RATE_LIMIT") ||
      error.message.includes("quota")
    ) {
      console.error("   Issue: Rate limit or quota exceeded");
      console.error("   Solution: Wait a few minutes and try again");
    } else if (
      error.message.includes("NETWORK") ||
      error.code === "ENOTFOUND"
    ) {
      console.error("   Issue: Network connectivity problem");
      console.error("   Solution: Check your internet connection");
    } else if (error.message.includes("model")) {
      console.error("   Issue: Model not found or unavailable");
      console.error("   Solution: Check if gemini-2.5-flash is available");
    } else {
      console.error("   Error:", error.message);
      console.error("   Full error:", error);
    }

    return false;
  }
}

async function testNetworkConnectivity() {
  console.log("🌐 Testing network connectivity...");

  try {
    const https = require("https");

    return new Promise((resolve, reject) => {
      const req = https.request(
        "https://generativelanguage.googleapis.com",
        { method: "HEAD" },
        (res) => {
          console.log("✅ Network connectivity to Google AI API: OK");
          console.log("   Status:", res.statusCode);
          resolve(true);
        }
      );

      req.on("error", (error) => {
        console.error("❌ Network connectivity failed:", error.message);
        reject(error);
      });

      req.setTimeout(5000, () => {
        console.error("❌ Network request timed out");
        req.destroy();
        reject(new Error("Timeout"));
      });

      req.end();
    });
  } catch (error) {
    console.error("❌ Network test failed:", error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 DIAM AI Pilot - Gemini API Diagnostic\n");

  try {
    // Test network connectivity first
    await testNetworkConnectivity();
    console.log();

    // Test Gemini API
    const success = await testGeminiConnection();

    if (success) {
      console.log(
        "\n✅ All tests passed! Your Gemini API is working correctly."
      );
      console.log("   You can now use the DIAM AI Pilot application.");
    } else {
      console.log("\n❌ Some tests failed. Please check the errors above.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n💥 Unexpected error:", error.message);
    process.exit(1);
  }
}

// Run the diagnostic
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testGeminiConnection, testNetworkConnectivity };

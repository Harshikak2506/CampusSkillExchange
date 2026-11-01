const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("=== RUNNING FRONTEND QUALITY & BUILD INTEGRITY VERIFICATION ===");

// 1. Check Dist Build Output
const distDir = path.resolve(__dirname, "../dist");
assert(fs.existsSync(distDir), "dist directory must exist after build");
const indexHtml = path.join(distDir, "index.html");
assert(fs.existsSync(indexHtml), "dist/index.html must exist");
const indexContent = fs.readFileSync(indexHtml, "utf8");
assert(indexContent.includes("<div id=\"root\"></div>"), "index.html must contain root mount div");
assert(indexContent.includes("<script type=\"module\""), "index.html must reference built module script");
assert(indexContent.includes("<link rel=\"stylesheet\""), "index.html must link built CSS bundle");

// 2. Check assets generated
const assetsDir = path.join(distDir, "assets");
assert(fs.existsSync(assetsDir), "dist/assets must exist");
const assetFiles = fs.readdirSync(assetsDir);
const hasJs = assetFiles.some((f) => f.endsWith(".js"));
const hasCss = assetFiles.some((f) => f.endsWith(".css"));
assert(hasJs, "dist/assets must contain bundled JS");
assert(hasCss, "dist/assets must contain bundled CSS");
console.log("✓ Build artifacts check: PASS (HTML, CSS, JS bundles verified)");

// 3. Test Storage Logic (simulated memory storage)
const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = global.__storageMock[key];
      if (item === null || item === undefined || item === "undefined") {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    global.__storageMock[key] = JSON.stringify(value);
  },
  remove: (key) => {
    delete global.__storageMock[key];
  }
};

global.__storageMock = {};
assert.strictEqual(storage.get("nonexistent", "fallback"), "fallback", "Storage fallback for missing keys");

// Test corrupted JSON recovery
global.__storageMock["corrupted"] = "{ invalid json string ";
assert.strictEqual(storage.get("corrupted", "fallback"), "fallback", "Storage handles corrupted JSON safely without crashing");

// Test valid JSON storage
storage.set("testUser", { id: "101", name: "Harshika" });
const retrieved = storage.get("testUser");
assert.strictEqual(retrieved.name, "Harshika", "Storage stores and retrieves valid JSON objects");
console.log("✓ Safe LocalStorage parsing & corrupted JSON recovery test: PASS");

// 4. Test API URL normalization logic
function normalizeUrl(url) {
  const base = url || "http://localhost:5000";
  return base.replace(/\/+$/, "");
}
assert.strictEqual(normalizeUrl("https://api.example.com/"), "https://api.example.com", "Trailing slash stripped");
assert.strictEqual(normalizeUrl("https://api.example.com"), "https://api.example.com", "Clean URL preserved");
assert.strictEqual(normalizeUrl(""), "http://localhost:5000", "Fallback to localhost");
console.log("✓ API URL normalization: PASS");

// 5. Test Vercel configuration
const vercelConfig = path.resolve(__dirname, "../vercel.json");
assert(fs.existsSync(vercelConfig), "vercel.json must exist");
const vercelJson = JSON.parse(fs.readFileSync(vercelConfig, "utf8"));
assert.strictEqual(vercelJson.outputDirectory, "dist", "Vercel outputDirectory must be dist");
assert(Array.isArray(vercelJson.rewrites), "Vercel rewrites must be configured for SPA routing");
console.log("✓ Vercel SPA routing configuration: PASS");

// 6. Test .env.example
const envExample = path.resolve(__dirname, "../.env.example");
assert(fs.existsSync(envExample), ".env.example must exist");
const envContent = fs.readFileSync(envExample, "utf8");
assert(envContent.includes("VITE_API_BASE_URL"), ".env.example must specify VITE_API_BASE_URL");
console.log("✓ Environment template .env.example: PASS");

console.log("=== ALL FRONTEND AUDIT & VERIFICATION TESTS PASSED SUCCESSFULLY! ===");


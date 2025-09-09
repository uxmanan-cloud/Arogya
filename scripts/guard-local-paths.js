const fs = require("fs")
const path = require("path")

const FORBIDDEN_PATTERNS = [
  "./test/data",
  "test/data/",
  "fs.readFile",
  "createReadStream",
  /pdf\s*$$\s*["'`][^"'`]*["'`]\s*$$/,
]

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      if (!file.startsWith(".") && file !== "node_modules") {
        scanDirectory(filePath, results)
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js") || file.endsWith(".jsx")) {
      results.push(filePath)
    }
  }

  return results
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  const violations = []

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (typeof pattern === "string") {
      if (content.includes(pattern)) {
        violations.push(`Found forbidden string: "${pattern}"`)
      }
    } else if (pattern instanceof RegExp) {
      const match = content.match(pattern)
      if (match) {
        violations.push(`Found forbidden pattern: ${match[0]}`)
      }
    }
  }

  return violations
}

function main() {
  const files = scanDirectory(".")
  let hasViolations = false

  for (const file of files) {
    const violations = checkFile(file)
    if (violations.length > 0) {
      console.error(`❌ ${file}:`)
      for (const violation of violations) {
        console.error(`   ${violation}`)
      }
      hasViolations = true
    }
  }

  if (hasViolations) {
    console.error("\n🚫 Build failed: Local file path references detected!")
    console.error("Remove all references to local test files and filesystem operations.")
    process.exit(1)
  } else {
    console.log("✅ No local file path violations found")
  }
}

main()

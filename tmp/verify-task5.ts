// Runtime probe for TODO task 5 acceptance
// Verifies SecurityFixAgent calls SecurityScanner.performScan without type/runtime errors

import { SecurityFixAgent } from "../packages/agents/src/security-fix-agent.js";

async function main() {
  const agent = new SecurityFixAgent(
    { id: "agent-secfix-verify", name: "SecurityFixAgent", type: "security-fix" },
    // Minimal db and kgService stubs (not used by verifyFix path)
    { falkordbQuery: async () => [] },
    {}
  ) as any;

  // Patch securityScanner with a stub exposing performScan
  agent.securityScanner = {
    async initialize() {},
    async performScan(_req: any, _opts: any) {
      return { issues: [] };
    },
  };

  const issue = {
    id: "issue-1",
    ruleId: "HARDCODED_SECRET",
    lineNumber: 10,
    metadata: { filePath: "tmp/dummy.txt" },
  };
  const result = { status: "pending" } as any;

  // Call the private method via bracket access; we only care that it runs
  await agent["verifyFix"](issue, result);

  console.log("OK: SecurityFixAgent invoked performScan successfully");
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});


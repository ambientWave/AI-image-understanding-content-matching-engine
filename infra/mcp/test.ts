// Simple test client
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const transport = new StdioClientTransport({ command: "tsx", args: ["infra/mcp/server.ts"] });
const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

await client.connect(transport);
const tools = await client.listTools();
console.log("Available tools:", tools);


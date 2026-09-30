import 'reflect-metadata';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'http';
import { registerIngestionTools } from './tools/ingestion.js';
import { registerMatchingTools } from './tools/matching.js';
import { registerRagTools } from './tools/rag.js';
import { registerCostTools } from './tools/cost.js';
import { registerImageTools } from './tools/images.js';
import { registerPostTools } from './tools/posts.js';
import { registerJobTools } from './tools/jobs.js';
import { container } from './container.js';

const server = new McpServer({ name: 'image-matcher', version: '1.0.0' });

const services = {
    ingestionOrchestrator: container.resolve('IngestionOrchestratorService'),
    evaluationService: container.resolve('EvaluationService'),
    matchingService: container.resolve('MatchingService'),
    ragService: container.resolve('RagService'),
    costLogRepo: container.resolve('CostLogDBRepository'),
    imageQueryService: container.resolve('ImageQueryService'),
    postQueryService: container.resolve('PostQueryService'),
    jobQueueService: container.resolve('JobQueueService'),
    imageUnderstandService: container.resolve('ImageUnderstandService'),
    imageEmbedService: container.resolve('ImageEmbedService'),
    postSummarizeService: container.resolve('PostSummarizeService'),
    postDownloadService: container.resolve('PostDownloadService'),
    textEmbedService: container.resolve('TextEmbedService'),
    postDBRepository: container.resolve('PostDBRepository'),
};

registerIngestionTools(server, services.ingestionOrchestrator as any);
registerMatchingTools(server, {
    evaluationService: services.evaluationService as any,
    matchingService: services.matchingService as any,
    postDBRepository: services.postDBRepository as any,
});
registerRagTools(server, {
    ragService: services.ragService as any,
    evaluationService: services.evaluationService as any,
    matchingService: services.matchingService as any,
    postDBRepository: services.postDBRepository as any,
});
registerCostTools(server, services.costLogRepo as any);
registerImageTools(server, {
    imageQueryService: services.imageQueryService as any,
    imageUnderstandService: services.imageUnderstandService as any,
    imageEmbedService: services.imageEmbedService as any,
});
registerPostTools(server, {
    postQueryService: services.postQueryService as any,
    postSummarizeService: services.postSummarizeService as any,
    postDownloadService: services.postDownloadService as any,
});
registerJobTools(server, services.jobQueueService as any);

const transport = process.env.MCP_TRANSPORT || 'stdio';

if (transport === 'stdio') {
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    console.error('MCP server running on stdio');
} else if (transport === 'http') {
    const httpServer = createServer(async (req, res) => {
        const transport = new StreamableHTTPServerTransport();
        await server.connect(transport as any);
        await transport.handleRequest(req, res);
    });
    const port = parseInt(process.env.MCP_HTTP_PORT || '3001', 10);
    httpServer.listen(port, () => {
        console.error(`MCP HTTP server listening on port ${port}`);
    });
}
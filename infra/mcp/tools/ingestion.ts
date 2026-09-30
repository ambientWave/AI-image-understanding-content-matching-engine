import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { IngestionOrchestratorService } from '../../../src/services/ingestion-orchestrator.service.js';
import { IngestImagesSchema, IngestPostsSchema } from '../schemas/index.js';
import { mcpError } from '../errors.js';

export function registerIngestionTools(
    server: McpServer,
    ingestionOrchestrator: IngestionOrchestratorService
) {
    server.registerTool('ingestImages', {
        description: 'Enqueue a batch of image URLs for asynchronous processing (vision → embed pipeline). Returns batchId and count.',
        inputSchema: IngestImagesSchema,
    }, async ({ imageUrls }) => {
        try {
            const result = await ingestionOrchestrator.enqueueIngestionPipeline(imageUrls);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
            return mcpError(error);
        }
    });

    server.registerTool('ingestPosts', {
        description: 'Enqueue a batch of article/blog URLs for async processing (download → summarize → embed pipeline). Returns batchId and count.',
        inputSchema: IngestPostsSchema,
    }, async ({ postUrls }) => {
        try {
            const result = await ingestionOrchestrator.enqueuePostPipeline(postUrls);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
            return mcpError(error);
        }
    });
}
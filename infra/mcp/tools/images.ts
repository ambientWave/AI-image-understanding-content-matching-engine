import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ImageQueryService } from '../../../src/services/image-query.service.js';
import { ImageUnderstandService } from '../../../src/services/image-understand.service.js';
import { ImageEmbedService } from '../../../src/services/image-embed.service.js';
import { ProcessImageSchema, EmbedImagesSchema, ListImagesSchema } from '../schemas/index.js';
import { mcpError } from '../errors.js';

export function registerImageTools(
    server: McpServer,
    services: {
        imageQueryService: ImageQueryService;
        imageUnderstandService: ImageUnderstandService;
        imageEmbedService: ImageEmbedService;
    }
) {
    const { imageQueryService, imageUnderstandService, imageEmbedService } = services;

    server.registerTool('listImages', {
        description: 'List processed images with pagination, filtering, and sorting.',
        inputSchema: ListImagesSchema,
    }, async ({ limit = 50, offset = 0, status, url_path, filename, orderBy = 'created_at', orderDir = 'DESC' }) => {
        try {
            const queryOptions: any = {
                limit: Math.min(limit, 100),
                offset,
                orderBy,
                orderDir,
            };
            if (status !== undefined) queryOptions.status = status;
            if (url_path !== undefined) queryOptions.url_path = url_path;
            if (filename !== undefined) queryOptions.filename = filename;

            const result = await imageQueryService.getImages(queryOptions);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
            return mcpError(error);
        }
    });

    server.registerTool('processImage', {
        description: 'Run full vision pipeline on a single image (lock → Gemini → Zod validate → save tags → log cost).',
        inputSchema: ProcessImageSchema,
    }, async ({ imageId }) => {
        try {
            const result = await imageUnderstandService.understandAndProcessImage(imageId);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
            return mcpError(error);
        }
    });

    server.registerTool('embedImages', {
        description: 'Generate CLIP embeddings for images and upsert to ChromaDB vector store.',
        inputSchema: EmbedImagesSchema,
    }, async ({ images }) => {
        try {
            await imageEmbedService.embedImagesFromUrls(images as any);
            return { content: [{ type: 'text', text: JSON.stringify({ success: true, count: images.length }) }] };
        } catch (error) {
            return mcpError(error);
        }
    });
}
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostQueryService } from '../../../src/services/post-query.service.js';
import { PostSummarizeService } from '../../../src/services/post-summarize.service.js';
import { PostDownloadService } from '../../../src/services/post-download.service.js';
import { ListPostsSchema, SummarizePostSchema, SummarizeTextSchema, FetchPostContentSchema } from '../schemas/index.js';
import { mcpError } from '../errors.js';

export function registerPostTools(
    server: McpServer,
    services: {
        postQueryService: PostQueryService;
        postSummarizeService: PostSummarizeService;
        postDownloadService: PostDownloadService;
    }
) {
    const { postQueryService, postSummarizeService, postDownloadService } = services;

    server.registerTool('listPosts', {
        description: 'List processed posts with pagination, filtering, and sorting.',
        inputSchema: ListPostsSchema,
    }, async ({ limit = 50, offset = 0, status, url_path, orderBy = 'created_at', orderDir = 'DESC' }) => {
        try {
            const queryOptions: any = {
                limit: Math.min(limit, 100),
                offset,
                orderBy,
                orderDir,
            };
            if (status !== undefined) queryOptions.status = status;
            if (url_path !== undefined) queryOptions.url_path = url_path;

            const result = await postQueryService.getPosts(queryOptions);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
            return mcpError(error);
        }
    });

    server.registerTool('summarizePost', {
        description: 'Fetch, summarize, and persist summary for a post using local T5-Small model.',
        inputSchema: SummarizePostSchema,
    }, async ({ postId }) => {
        try {
            const summary = await postSummarizeService.summarizePost(postId);
            return { content: [{ type: 'text', text: JSON.stringify({ postId, summary }) }] };
        } catch (error) {
            return mcpError(error);
        }
    });

    server.registerTool('summarizeText', {
        description: 'Generate summary from raw text using local T5-Small model (no persistence).',
        inputSchema: SummarizeTextSchema,
    }, async ({ text }) => {
        try {
            const result = await postSummarizeService.summarize(text);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
            return mcpError(error);
        }
    });

    server.registerTool('fetchPostContent', {
        description: 'Download and extract text content from article URLs.',
        inputSchema: FetchPostContentSchema,
    }, async ({ urls }) => {
        try {
            const result = await postDownloadService.fetchPostsText(urls);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
            return mcpError(error);
        }
    });
}
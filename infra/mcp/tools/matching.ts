import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { EvaluationService } from '../../../src/services/evaluation.service.js';
import { MatchingService } from '../../../src/services/matching.service.js';
import { PostDBRepository } from '../../../src/repositories/post-db.repository.js';
import { EvaluateMatchSchema, FindSimilarImagesSchema } from '../schemas/index.js';
import { mcpError } from '../errors.js';

export function registerMatchingTools(
    server: McpServer,
    services: {
        evaluationService: EvaluationService;
        matchingService: MatchingService;
        postDBRepository: PostDBRepository;
    }
) {
    const { evaluationService, matchingService, postDBRepository } = services;

    server.registerTool('evaluateMatch', {
        description: 'Run semantic matching with guardrails for a post. Returns candidates with ACCEPTED/REJECTED decisions and RAG-generated explanations.',
        inputSchema: EvaluateMatchSchema,
    }, async ({ postId, resultsNumber = 10 }) => {
        try {
            const result = await evaluationService.evaluate(postId, resultsNumber);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
            return mcpError(error);
        }
    });

    server.registerTool('findSimilarImages', {
        description: 'Vector similarity search against image corpus. Provide either postId (uses post summary embedding) or raw embedding vector.',
        inputSchema: FindSimilarImagesSchema,
    }, async ({ postId, embedding, nResults = 10 }) => {
        try {
            let postEmbedding = embedding;
            if (postId) {
                const post = await postDBRepository.findById(postId);
                if (!post?.summary) {
                    throw new Error('Post not found or has no summary');
                }
                postEmbedding = await matchingService.getPostEmbedding(postId, post.summary);
            }
            if (!postEmbedding) {
                throw new Error('No embedding available');
            }
            const results = await matchingService.findSimilarImages(postEmbedding, nResults);
            return { content: [{ type: 'text', text: JSON.stringify(results) }] };
        } catch (error) {
            return mcpError(error);
        }
    });
}
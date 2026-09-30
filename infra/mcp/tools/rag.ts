import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RagService } from '../../../src/services/rag.service.js';
import { EvaluationService } from '../../../src/services/evaluation.service.js';
import { MatchingService } from '../../../src/services/matching.service.js';
import { PostDBRepository } from '../../../src/repositories/post-db.repository.js';
import { ChatWithCorpusSchema, ExplainMatchSchema } from '../schemas/index.js';
import { mcpError } from '../errors.js';

export function registerRagTools(
    server: McpServer,
    services: {
        ragService: RagService;
        evaluationService: EvaluationService;
        matchingService: MatchingService;
        postDBRepository: PostDBRepository;
    }
) {
    const { ragService, evaluationService, matchingService, postDBRepository } = services;

    server.registerTool('chatWithCorpus', {
        description: 'Conversational RAG over posts and images. Provide a natural language query with optional context (postId, imageIds). Returns grounded response with citations.',
        inputSchema: ChatWithCorpusSchema,
    }, async ({ query, postId, imageIds, topK = 10 }) => {
        try {
            let postSummary: string | null = null;
            let candidates: any[] = [];

            if (postId) {
                const post = await postDBRepository.findById(postId);
                if (post?.summary) {
                    postSummary = post.summary;
                    const postEmbedding = await matchingService.getPostEmbedding(postId, post.summary);
                    const similarImages = await matchingService.findSimilarImages(postEmbedding, topK);
                    candidates = similarImages;
                }
            }

            if (imageIds && imageIds.length > 0) {
                // If specific image IDs provided, fetch their data
                // This would require additional repository method - for now use post-based candidates
            }

            const result = await ragService.chatWithContext(query, postSummary, candidates);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
            return mcpError(error);
        }
    });

    server.registerTool('explainMatch', {
        description: 'Generate a grounded guard explanation for a specific candidate match using RAG. Cites subject/category/confidence from retrieved candidates.',
        inputSchema: ExplainMatchSchema,
    }, async ({ postId, candidateIds, isAccepted }) => {
        try {
            const post = await postDBRepository.findById(postId);
            if (!post?.summary) {
                throw new Error('Post not found or has no summary');
            }

            const postEmbedding = await matchingService.getPostEmbedding(postId, post.summary);
            const similarImages = await matchingService.findSimilarImages(postEmbedding, candidateIds.length);

            // Filter to requested candidate IDs
            const candidates = similarImages.filter(img => candidateIds.includes(img.imageId));

            if (candidates.length === 0) {
                throw new Error('No matching candidates found');
            }

            const postCategory = evaluationService['extractCategory'](post.summary);
            const result = await ragService.explainMatch(post.summary, postCategory, candidates, isAccepted);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
            return mcpError(error);
        }
    });
}
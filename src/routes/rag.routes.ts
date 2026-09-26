import { Router, type Request, type Response, type NextFunction } from 'express';
import { EvaluationService } from '../services/evaluation.service.ts';
import { MatchingService, type SimilarityResult } from '../services/matching.service.ts';
import { PostDBRepository } from '../repositories/post-db.repository.ts';
import { ImageDBRepository } from '../repositories/image-db.repository.ts';
import { RagService } from '../services/rag.service.ts';
import { container } from '../config/container.ts';

const router: Router = Router();
const evaluationService = container.resolve('EvaluationService') as EvaluationService;
const matchingService = container.resolve('MatchingService') as MatchingService;
const postDBRepository = container.resolve('PostDBRepository') as PostDBRepository;
const imageDBRepository = container.resolve('ImageDBRepository') as ImageDBRepository;
const ragService = container.resolve('RagService') as RagService;

interface ExplainRequestBody {
    postId: string;
    candidateIds: string[];
    isAccepted?: boolean;
}

interface ChatRequestBody {
    query: string;
    postId?: string;
    imageIds?: string[];
    topK?: number;
}

router.get('/rag/models', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({
            name: 'Qwen2.5-1.5B-Instruct',
            modelId: 'onnx-community/Qwen2.5-1.5B-Instruct',
            loaded: true,
            contextWindow: 32768,
            quantization: 'fp16'
        });
    } catch (err) {
        next(err);
    }
});

router.post('/rag/explain', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { postId, candidateIds, isAccepted } = req.body as ExplainRequestBody;

        if (!postId || !candidateIds || !Array.isArray(candidateIds)) {
            return res.status(400).json({ error: 'postId and candidateIds[] are required' });
        }

        const post = await postDBRepository.findById(postId);
        if (!post) {
            return res.status(404).json({ error: `Post ${postId} not found` });
        }

        const postSummary = post.summary || '';
        const postCategory = evaluationService['extractCategory'](postSummary);

        const candidates: SimilarityResult[] = [];
        for (const imageId of candidateIds) {
            const image = await imageDBRepository.findById(imageId);
            if (image && image.tag) {
                const tag = image.tag as any;
                candidates.push({
                    imageId: image.id,
                    imageUrl: image.url_path,
                    caption: tag.caption || '',
                    subject: tag.subject || '',
                    category: tag.category || '',
                    confidence: tag.confidence || 0,
                    similarity: 0, // placeholder for explain endpoint
                });
            }
        }

        if (candidates.length === 0) {
            return res.status(400).json({ error: 'No valid candidates found' });
        }

        const result = await ragService.explainMatch(
            postSummary,
            postCategory,
            candidates,
            isAccepted ?? true
        );

        res.json({
            explanation: result.explanation,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens
        });
    } catch (err) {
        next(err);
    }
});

router.post('/rag/chat', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query, postId, imageIds, topK = 10 } = req.body as ChatRequestBody;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'query is required' });
        }

        let postSummary: string | null = null;
        if (postId) {
            const post = await postDBRepository.findById(postId);
            postSummary = post?.summary || null;
        }

        let candidates: SimilarityResult[] = [];

        if (imageIds && imageIds.length > 0) {
            for (const imageId of imageIds) {
                const image = await imageDBRepository.findById(imageId);
                if (image && image.tag) {
                    const tag = image.tag as any;
                    candidates.push({
                        imageId: image.id,
                        imageUrl: image.url_path,
                        caption: tag.caption || '',
                        subject: tag.subject || '',
                        category: tag.category || '',
                        confidence: tag.confidence || 0,
                        similarity: 0,
                    });
                }
            }
        } else if (postSummary) {
            const postEmbedding = await matchingService.getPostEmbedding(postId!, postSummary);
            candidates = await matchingService.findSimilarImages(postEmbedding, topK);
        }

        if (candidates.length === 0) {
            return res.status(400).json({ error: 'No context available for chat. Provide postId or imageIds.' });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const sendEvent = (data: any) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        const candidateMeta = candidates.slice(0, 10).map(c => ({
            subject: c.subject || 'unknown',
            category: c.category || 'unknown',
            confidence: c.confidence || 0,
            caption: c.caption || 'No caption',
            imageUrl: c.imageUrl
        }));

        try {
            const result = await ragService.chatWithContext(query, postSummary, candidates.slice(0, 10));
            console.log('result', result);
            sendEvent({
                token: result.explanation,
                done: true,
                citations: candidateMeta.map((c, i) => ({ index: i + 1, ...c }))
            });
        } catch (error) {
            console.error('Chat generation error:', error);
            sendEvent({
                token: 'Error generating response',
                done: true,
                error: 'Generation failed'
            });
        }

        res.end();
    } catch (err) {
        next(err);
    }
});

export default router;
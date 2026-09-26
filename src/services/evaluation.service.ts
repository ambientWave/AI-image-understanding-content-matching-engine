import { injectable } from 'tsyringe';
import { MatchingService, type SimilarityResult } from './matching.service.ts';
import { PostDBRepository } from '../repositories/post-db.repository.ts';
import { RagService, type RagExplanation } from './rag.service.ts';

const SIMILARITY_THRESHOLD = 0.8;

export interface EvaluationCandidate {
    post: string;
    candidate: string;
    result: 'ACCEPTED' | 'REJECTED';
    reason: string;
    similarity: number;
    imageId: string;
    imageUrl: string;
}

export interface EvaluationResponse {
    postId: string;
    postSummary: string;
    candidates: EvaluationCandidate[];
}

@injectable()
export class EvaluationService {
    constructor(
        private matchingService: MatchingService,
        private postDBRepository: PostDBRepository,
        private ragService: RagService
    ) { }

    async evaluate(postId: string, resultsNumber: number = 10): Promise<EvaluationResponse> {
        const post = await this.postDBRepository.findById(postId);
        if (!post) {
            throw new Error(`Post ${postId} not found`);
        }

        const postSummary = post.summary || '';
        if (!postSummary) {
            throw new Error(`Post ${postId} has no summary`);
        }

        const postEmbedding = await this.matchingService.getPostEmbedding(postId, postSummary);

        const similarImages = await this.matchingService.findSimilarImages(postEmbedding, resultsNumber);

        const candidates: EvaluationCandidate[] = await Promise.all(similarImages.map(async (img) => {
            const isAccepted = img.similarity >= SIMILARITY_THRESHOLD;
            const candidateCaption = img.caption || 'No caption';

            let reason: string;
            try {
                const postCategory = this.extractCategory(postSummary);
                const ragResult = await this.ragService.explainMatch(
                    postSummary,
                    postCategory,
                    similarImages,
                    isAccepted
                );
                reason = ragResult.explanation;
            } catch (error) {
                // Silent fallback to template reasons
                if (isAccepted) {
                    reason = `Similarity ${img.similarity.toFixed(2)} ≥ ${SIMILARITY_THRESHOLD} threshold`;
                } else {
                    const postCategory = this.extractCategory(postSummary);
                    const imageCategory = img.category || 'unknown';

                    if (postCategory && imageCategory !== 'unknown' && postCategory !== imageCategory) {
                        reason = `Category mismatch: post about "${postCategory}", image is "${imageCategory}" (similarity ${img.similarity.toFixed(2)} < ${SIMILARITY_THRESHOLD})`;
                    } else {
                        reason = `Under threshold: similarity ${img.similarity.toFixed(2)} < ${SIMILARITY_THRESHOLD}`;
                    }
                }
            }

            return {
                post: postSummary,
                candidate: candidateCaption,
                result: isAccepted ? 'ACCEPTED' : 'REJECTED',
                reason,
                similarity: img.similarity,
                imageId: img.imageId,
                imageUrl: img.imageUrl,
            };
        }));

        return {
            postId: post.id,
            postSummary,
            candidates,
        };
    }

    private extractCategory(text: string): string | null {
        const lowerText = text.toLowerCase();
        const categories = ['fox', 'wolf', 'dog', 'cat', 'bird', 'animal', 'landscape', 'person', 'vehicle', 'building', 'food', 'plant'];

        for (const cat of categories) {
            if (lowerText.includes(cat)) {
                return cat;
            }
        }
        return null;
    }
}
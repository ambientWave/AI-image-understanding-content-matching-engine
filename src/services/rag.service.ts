import { injectable } from 'tsyringe';
import { RagRepository, type GenerationResult } from '../repositories/rag.repository.ts';
import { CostLogDBRepository } from '../repositories/cost-log-db.repository.ts';
import { type SimilarityResult } from './matching.service.ts';

interface CandidateMeta {
    subject: string;
    category: string;
    confidence: number;
    caption: string;
    imageUrl: string;
}

export interface RagExplanation {
    explanation: string;
    inputTokens: number;
    outputTokens: number;
}

@injectable()
export class RagService {
    constructor(
        private ragRepository: RagRepository,
        private costLogDBRepository: CostLogDBRepository
    ) { }

    async explainMatch(
        postSummary: string,
        postCategory: string | null,
        candidates: SimilarityResult[],
        isAccepted: boolean
    ): Promise<RagExplanation> {
        const candidateMeta = candidates.map(c => ({
            subject: c.subject || 'unknown',
            category: c.category || 'unknown',
            confidence: c.confidence || 0,
            caption: c.caption || 'No caption',
            imageUrl: c.imageUrl
        }));
        const text = await this.ragRepository.explainMatch(
            postSummary,
            postCategory,
            candidateMeta,
            isAccepted
        );

        // For explainMatch, we don't have token counts from the repo method
        // Use estimate based on text length
        const inputTokens = Math.ceil(postSummary.length / 4);
        const outputTokens = Math.ceil(text.length / 4);

        await this.logCost(inputTokens, outputTokens);
        console.log("Rag response for match explanation is : ", text);
        return { explanation: text, inputTokens, outputTokens };
    }

    async chatWithContext(
        userQuery: string,
        postSummary: string | null,
        candidates: SimilarityResult[]
    ): Promise<RagExplanation> {
        const candidateMeta = candidates.map(c => ({
            subject: c.subject || 'unknown',
            category: c.category || 'unknown',
            confidence: c.confidence || 0,
            caption: c.caption || 'No caption',
            imageUrl: c.imageUrl
        }));
        const { text, inputTokens, outputTokens } = await this.ragRepository.chatWithContext(
            userQuery,
            postSummary,
            candidateMeta
        );

        await this.logCost(inputTokens, outputTokens);
        console.log("Rag response for " + userQuery + "is", text);
        return { explanation: text, inputTokens, outputTokens };
    }

    private async logCost(inputTokens: number, outputTokens: number): Promise<void> {
        const totalTokens = inputTokens + outputTokens;
        await this.costLogDBRepository.insert({
            call_type: 'rag',
            ref_id: crypto.randomUUID(),
            tokens_or_units: totalTokens,
            cost_usd: 0,
        });
    }
}
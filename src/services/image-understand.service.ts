import { injectable } from 'tsyringe';
import { getDataFromUrls } from "../middleware/request-utils.ts";
import { ImageUnderstandRepository, type AnalysisResult, type UsageMetadata } from "../repositories/image-understand.repository.ts";
import { ImageDBRepository } from "../repositories/image-db.repository.ts";
import { CostLogDBRepository } from "../repositories/cost-log-db.repository.ts";
import { z } from "zod";

export const VisionTagSchema = z.object({
    subject: z.string().min(1),
    category: z.string().min(1),
    attributes: z.array(z.string()).default([]),
    caption: z.string().min(1),
    confidence: z.number().min(0).max(1),
});

export interface ValidatedImageData {
    id: string;
    imageUrl: string;
    caption: string;
    tags: string[];
    subject: string;
    category: string;
    confidence: number;
}

const GEMINI_FLASH_LITE_INPUT_COST_PER_TOKEN = 0.00000025;
const GEMINI_FLASH_LITE_OUTPUT_COST_PER_TOKEN = 0.0000015;

@injectable()
export class ImageUnderstandService {
    constructor(
        private imageUnderstandRepo: ImageUnderstandRepository,
        private imageDBRepository: ImageDBRepository,
        private costLogDBRepository: CostLogDBRepository
    ) { }

    async understandImage(imageUrls: string[]): Promise<{ imageUrl: any; response: AnalysisResult }[]> {
        const results: { imageUrl: any; response: AnalysisResult }[] = [];
        const imageDatas = await getDataFromUrls(imageUrls, true);
        if (!imageDatas) {
            return [];
        }
        for (let i = 0; i < imageDatas.length; i++) {
            const imageUrl = imageUrls[i] as string;
            const imageData = imageDatas[i]?.content as Buffer<ArrayBuffer>;
            if (!imageData) {
                continue;
            }
            const aiResponse = await this.imageUnderstandRepo.analyzeImage(imageUrl, imageData);
            console.log("understand result", aiResponse);
            if (aiResponse) {
                results.push({ imageUrl, response: aiResponse });
            }
        }
        return results;
    }

    async validateSchema(imageUrl: string, aiResponse: {
        subject: string,
        category: string,
        attributes: string[],
        caption: string,
        confidence: number,
    }): Promise<{
        imageUrl: string, data: {
            tags: string[],
        }, error?: string
    }> {
        try {
            const validatedData = VisionTagSchema.parse(aiResponse);
            if (validatedData.confidence < 0.8) {
                return { imageUrl: imageUrl, data: { tags: validatedData.attributes }, error: 'Confidence is low' };
            }
            return { imageUrl: imageUrl, data: { tags: validatedData.attributes } };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return { imageUrl: imageUrl, data: { tags: aiResponse.attributes }, error: "Invalid Schema" };
            }
            throw error;
        }
    }

    async saveImageTags(imageId: string, data: ValidatedImageData): Promise<void> {
        const tagData = {
            subject: data.subject,
            category: data.category,
            attributes: data.tags,
            caption: data.caption,
            confidence: data.confidence,
            flagged: data.confidence < 0.8,
            raw_response: JSON.stringify(data),
        };
        await this.imageDBRepository.update([imageId], { tag: tagData });
    }

    async logCost(refId: string, usage: UsageMetadata): Promise<void> {
        console.log(`Gemini usage meta response: ${usage}`)
        const inputTokens = usage.promptTokenCount ?? 0;
        const outputTokens = usage.candidatesTokenCount ?? 0;
        const totalTokens = usage.totalTokenCount ?? (inputTokens + outputTokens);

        const inputCost = inputTokens * GEMINI_FLASH_LITE_INPUT_COST_PER_TOKEN;
        const outputCost = outputTokens * GEMINI_FLASH_LITE_OUTPUT_COST_PER_TOKEN;
        const totalCost = inputCost + outputCost;

        await this.costLogDBRepository.insert({
            call_type: 'vision',
            ref_id: refId,
            tokens_or_units: totalTokens,
            cost_usd: totalCost,
        });
    }

    async understandAndProcessImage(imageId: string): Promise<ValidatedImageData | null> {
        const image = await this.imageDBRepository.findById(imageId);

        if (!image) {
            console.log(`Image ${imageId} not found`);
            return null;
        }

        if (image.status === 'completed' || image.status === 'embedded') {
            console.log(`Image ${imageId} already ${image.status}, skipping`);
            return null;
        }

        await this.imageDBRepository.update([imageId], { status: 'processing' });

        const aiResponses = await this.understandImage([image.url_path]);
        if (aiResponses.length === 0 || !aiResponses[0]?.response?.analysis) {
            await this.imageDBRepository.update([imageId], { status: 'failed' });
            return null;
        }

        const result = aiResponses[0].response!;
        const aiResponse = result.analysis;
        if (!aiResponse) {
            await this.imageDBRepository.update([imageId], { status: 'failed' });
            return null;
        }
        const validated = await this.validateSchema(image.url_path, aiResponse);
        if (validated.error && validated.error !== 'Confidence is low') {
            await this.imageDBRepository.update([imageId], { status: 'failed' });
            return null;
        }

        if (result.usageMetadata) {
            await this.logCost(imageId, result.usageMetadata);
        } else {
            await this.logCost(imageId, { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 });
        }

        const imageData: ValidatedImageData = {
            id: imageId,
            imageUrl: image.url_path,
            tags: validated.data.tags,
            subject: aiResponse.subject,
            category: aiResponse.category,
            caption: aiResponse.caption,
            confidence: aiResponse.confidence,
        };

        await this.saveImageTags(imageId, imageData);
        await this.imageDBRepository.update([imageId], { status: 'completed' });

        return imageData;
    }
}
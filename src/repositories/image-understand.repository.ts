import { injectable } from 'tsyringe';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import { imageToBase64, getMimeType } from "../middleware/image-utils.ts";

dotenv.config();

export interface ImageAnalysis {
    subject: string;
    category: string;
    attributes: string[];
    caption: string;
    confidence: number;
}

export interface UsageMetadata {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
}

export interface AnalysisResult {
    analysis: ImageAnalysis | null;
    usageMetadata: UsageMetadata | undefined;
    preCountTokens: number | undefined;
}

@injectable()
export class ImageUnderstandRepository {
    private client: GoogleGenAI;

    constructor() {
        this.client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    }

    /**
     * Analyzes a single image using Gemini Vision with token counting
     */
    async analyzeImage(imagePath: string, image: Buffer<ArrayBuffer>): Promise<AnalysisResult> {
        try {
            const base64Image = await imageToBase64(image);
            const mimeType = getMimeType(imagePath);

            const systemPrompt = `You are an expert image analyst. Analyze the image and respond ONLY with valid JSON in this exact format:
                            {
                                "subject": "main subject of the image",
                                "category": "category like: animal, person, object, landscape, etc",
                                "attributes": ["attribute1", "attribute2", "attribute3"],
                                "caption": "brief descriptive caption (10-20 words)",
                                "confidence": 0.0-1.0 confidence score
                            }

                            Be precise and concise. Always respond with valid JSON only.`;

            const contents = [
                {
                    role: "system",
                    parts: [{ text: systemPrompt }],
                },
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType,
                                data: base64Image,
                            },
                        },
                        {
                            text: 'Analyze this image and provide structured data as JSON.',
                        },
                    ],
                },
            ];

            const model = "gemini-3.1-flash-lite";

            let preCountTokens: number | undefined;
            try {
                const countResponse = await this.client.models.countTokens({
                    model,
                    contents,
                });
                preCountTokens = countResponse.totalTokens;
            } catch (countError) {
                console.warn('Pre-count tokens failed:', countError);
            }

            const response = await this.client.models.generateContent({
                model,
                contents,
                config: {
                    responseMimeType: 'application/json',
                    maxOutputTokens: 500,
                    temperature: 0.2,
                },
            });

            const textContent = response.candidates?.[0]?.content?.parts?.[0];
            if (!textContent?.text) {
                throw new Error('No text response from model');
            }

            const analysis = JSON.parse(textContent.text) as ImageAnalysis;

            const usageMetadata: UsageMetadata | undefined = (response as any).usageMetadata ? {
                promptTokenCount: (response as any).usageMetadata.promptTokenCount ?? 0,
                candidatesTokenCount: (response as any).usageMetadata.candidatesTokenCount ?? 0,
                totalTokenCount: (response as any).usageMetadata.totalTokenCount ?? 0,
                cachedContentTokenCount: (response as any).usageMetadata.cachedContentTokenCount,
                thoughtsTokenCount: (response as any).usageMetadata.thoughtsTokenCount,
            } : undefined;

            return {
                analysis,
                usageMetadata,
                preCountTokens,
            };
        } catch (error) {
            console.error(`Error analyzing ${imagePath}:`, error);
            return { analysis: null, usageMetadata: undefined, preCountTokens: undefined };
        }
    }
}
import { z } from 'zod';

export const IngestImagesSchema = z.object({
    imageUrls: z.array(z.string().url()).min(1).max(100),
});

export const IngestPostsSchema = z.object({
    postUrls: z.array(z.string().url()).min(1).max(50),
});

export const EvaluateMatchSchema = z.object({
    postId: z.string().uuid(),
    resultsNumber: z.number().int().min(1).max(50).optional(),
});

export const ChatWithCorpusSchema = z.object({
    query: z.string().min(1).max(2000),
    postId: z.string().uuid().optional(),
    imageIds: z.array(z.string().uuid()).max(10).optional(),
    topK: z.number().int().min(1).max(20).optional(),
});

export const GetCostLogSchema = z.object({
    callType: z.enum(['vision', 'embedding', 'summarization', 'rag']).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
});

export const FindSimilarImagesSchema = z.object({
    postId: z.string().uuid().optional(),
    embedding: z.array(z.number()).optional(),
    nResults: z.number().int().min(1).max(50).optional(),
}).refine(data => data.postId || data.embedding, {
    message: 'Either postId or embedding must be provided',
});

export const ProcessImageSchema = z.object({
    imageId: z.string().uuid(),
});

export const EmbedImagesSchema = z.object({
    images: z.array(z.object({
        imageUrl: z.string().url(),
        tags: z.array(z.string()).optional(),
    })).min(1).max(50),
});

export const SummarizePostSchema = z.object({
    postId: z.string().uuid(),
});

export const SummarizeTextSchema = z.object({
    text: z.string().min(1).max(50000),
});

export const ExplainMatchSchema = z.object({
    postId: z.string().uuid(),
    candidateIds: z.array(z.string().uuid()).min(1).max(10),
    isAccepted: z.boolean(),
});

export const ListImagesSchema = z.object({
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
    status: z.string().optional(),
    url_path: z.string().optional(),
    filename: z.string().optional(),
    orderBy: z.enum(['created_at', 'updated_at', 'filename']).optional(),
    orderDir: z.enum(['ASC', 'DESC']).optional(),
});

export const ListPostsSchema = z.object({
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
    status: z.string().optional(),
    url_path: z.string().optional(),
    orderBy: z.enum(['created_at', 'updated_at', 'url_path']).optional(),
    orderDir: z.enum(['ASC', 'DESC']).optional(),
});

export const GetJobStatusSchema = z.object({
    queue: z.enum(['vision', 'embed', 'post-summarize']),
    id: z.string().uuid(),
});

export const ListJobsSchema = z.object({
    queue: z.enum(['vision', 'embed', 'post-summarize']).optional(),
    status: z.enum(['waiting', 'active', 'completed', 'failed', 'delayed']).optional(),
    limit: z.number().int().min(1).max(500).optional(),
});

export const FetchPostContentSchema = z.object({
    urls: z.array(z.string().url()).min(1).max(20),
});

export type IngestImagesInput = z.infer<typeof IngestImagesSchema>;
export type IngestPostsInput = z.infer<typeof IngestPostsSchema>;
export type EvaluateMatchInput = z.infer<typeof EvaluateMatchSchema>;
export type ChatWithCorpusInput = z.infer<typeof ChatWithCorpusSchema>;
export type GetCostLogInput = z.infer<typeof GetCostLogSchema>;
export type FindSimilarImagesInput = z.infer<typeof FindSimilarImagesSchema>;
export type ProcessImageInput = z.infer<typeof ProcessImageSchema>;
export type EmbedImagesInput = z.infer<typeof EmbedImagesSchema>;
export type SummarizePostInput = z.infer<typeof SummarizePostSchema>;
export type SummarizeTextInput = z.infer<typeof SummarizeTextSchema>;
export type ExplainMatchInput = z.infer<typeof ExplainMatchSchema>;
export type ListImagesInput = z.infer<typeof ListImagesSchema>;
export type ListPostsInput = z.infer<typeof ListPostsSchema>;
export type GetJobStatusInput = z.infer<typeof GetJobStatusSchema>;
export type ListJobsInput = z.infer<typeof ListJobsSchema>;
export type FetchPostContentInput = z.infer<typeof FetchPostContentSchema>;
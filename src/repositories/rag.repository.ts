import { injectable } from 'tsyringe';
import {
    AutoTokenizer,
    AutoModelForCausalLM,
    type PreTrainedTokenizer,
    type PreTrainedModel,
} from '@huggingface/transformers';

const MODEL_ID = 'onnx-community/Qwen2.5-1.5B-Instruct';

export interface GenerationResult {
    text: string;
    inputTokens: number;
    outputTokens: number;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

@injectable()
export class RagRepository {
    private _model: PreTrainedModel | null = null;
    private _tokenizer: PreTrainedTokenizer | null = null;
    private _loadPromise: Promise<void> | null = null;

    /**
     * Lazy-loads the model and tokenizer on first use.
     * Loading is deferred to avoid RAM contention at server startup.
     *
     * device: 'cpu' → no GPU, uses main RAM
     * device: 'dml' → uses DML (better than CPU, but not full CUDA)
     * device: 'cuda' → full GPU (if supported)
     * Transformers.js backend, Windows exposes dml and cpu, not cuda.
     * The cuda device path is currently associated with the native Node backend on Linux x64.
     * Windows uses DirectML for the supported native acceleration path
     *
     * dtype: 'fp32' → full precision (accurate, uses more memory)
     * dtype: 'fp16' → half precision (fast, saves memory)
     * dtype: 'q8'  → 8-bit quantized (good accuracy, ~2x less RAM than fp32)
     * dtype: 'q4'  → 4-bit quantized (lower accuracy, ~4–8x less RAM — best for CPU)
     */
    private async initializeModel(): Promise<void> {
        this._model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, { device: 'cpu', dtype: 'q4' });
        this._tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
    }

    async waitUntilReady(): Promise<void> {
        // Lazy-init: only load the model when first needed
        if (!this._loadPromise) {
            this._loadPromise = this.initializeModel();
        }
        await this._loadPromise;
    }

    async generate(prompt: string): Promise<GenerationResult> {
        await this.waitUntilReady();
        const tokenizer = this._tokenizer!;
        const model = this._model!;

        const inputs = await tokenizer(prompt, { return_tensors: 'pt', truncation: true, max_length: 4096 });
        const inputTokens = inputs.input_ids.dims?.[1] ?? inputs.input_ids.shape?.[1] ?? inputs.input_ids.size;

        const generated_ids = await model.generate({
            ...inputs,
            max_new_tokens: 256,
            min_new_tokens: 10,
            temperature: 0.3,
            top_p: 0.9,
            do_sample: true,
            no_repeat_ngram_size: 3,
            eos_token_id: tokenizer.eos_token_id,
            pad_token_id: tokenizer.pad_token_id ?? tokenizer.eos_token_id,
        });

        const outputTokens = ((generated_ids as any).dims?.[1] ?? (generated_ids as any).shape?.[1] ?? (generated_ids as any).size) - inputTokens;
        const tokensArray = typeof (generated_ids as any).tolist === 'function' ? (generated_ids as any).tolist()[0] : Array.from((generated_ids as any).data ?? generated_ids);
        const text = tokenizer.decode(tokensArray.slice(inputTokens), { skip_special_tokens: true });

        return { text: text.trim(), inputTokens, outputTokens };
    }

    async generateChat(messages: ChatMessage[]): Promise<GenerationResult> {
        await this.waitUntilReady();
        const tokenizer = this._tokenizer!;
        const model = this._model!;

        const prompt = tokenizer.apply_chat_template?.(messages, { tokenize: false, add_generation_prompt: true })
            ?? messages.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';

        const inputs = await tokenizer(prompt, { return_tensors: 'pt', truncation: true, max_length: 4096 });
        const inputTokens = inputs.input_ids.dims?.[1] ?? inputs.input_ids.shape?.[1] ?? inputs.input_ids.size;

        const generated_ids = await model.generate({
            ...inputs,
            max_new_tokens: 512,
            min_new_tokens: 10,
            temperature: 0.3,
            top_p: 0.9,
            do_sample: true,
            no_repeat_ngram_size: 3,
            eos_token_id: tokenizer.eos_token_id,
            pad_token_id: tokenizer.pad_token_id ?? tokenizer.eos_token_id,
        });

        const outputTokens = ((generated_ids as any).dims?.[1] ?? (generated_ids as any).shape?.[1] ?? (generated_ids as any).size) - inputTokens;
        const tokensArray = typeof (generated_ids as any).tolist === 'function' ? (generated_ids as any).tolist()[0] : Array.from((generated_ids as any).data ?? generated_ids);
        const text = tokenizer.decode(tokensArray.slice(inputTokens), { skip_special_tokens: true });

        return { text: text.trim(), inputTokens, outputTokens };
    }

    async explainMatch(
        postSummary: string,
        postCategory: string | null,
        candidates: Array<{
            subject: string;
            category: string;
            confidence: number;
            caption: string;
            imageUrl: string;
        }>,
        isAccepted: boolean
    ): Promise<string> {
        const topCandidates = candidates.slice(0, 5);
        const context = topCandidates
            .map((c, i) => `${i + 1}. subject="${c.subject || 'unknown'}" category="${c.category || 'unknown'}" confidence=${(c.confidence || 0).toFixed(2)} caption="${c.caption || 'No caption'}"`)
            .join("\n");

        const verdict = isAccepted ? 'a good match' : 'NOT a good match';
        const guidance = isAccepted
            ? 'Explain why candidate #1 IS a good match, citing the specific subject/category/confidence fields that support this.'
            : 'Explain why candidate #1 is NOT a good match, citing the specific subject/category/confidence fields that support this.';

        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: 'You are a precise evaluator. Using ONLY the retrieved candidate metadata below, explain in ONE sentence whether candidate #1 is a good match for the post. Cite specific subject/category/confidence fields from the candidate data. Do not use outside knowledge.'
            },
            {
                role: 'user',
                content: `Post summary: "${postSummary}"
Post category: ${postCategory || 'unknown'}

Retrieved candidates:
${context}

Is candidate #1 ${verdict} for this post? ${guidance}`
            }
        ];

        const { text } = await this.generateChat(messages);
        return text;
    }

    async chatWithContext(
        userQuery: string,
        postSummary: string | null,
        candidates: Array<{
            subject: string;
            category: string;
            confidence: number;
            caption: string;
            imageUrl: string;
        }>
    ): Promise<GenerationResult> {
        const topCandidates = candidates.slice(0, 10);
        const context = topCandidates
            .map((c, i) => `${i + 1}. subject="${c.subject || 'unknown'}" category="${c.category || 'unknown'}" confidence=${(c.confidence || 0).toFixed(2)} caption="${c.caption || 'No caption'}" imageUrl="${c.imageUrl}"`)
            .join("\n");

        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: 'You are a helpful assistant that answers questions about images and posts using ONLY the provided retrieved data. Cite specific candidates by number when referencing them. If the answer cannot be determined from the data, say so.'
            },
            {
                role: 'user',
                content: `User query: "${userQuery}"
${postSummary ? `Post summary: "${postSummary}"` : ''}

Retrieved candidates:
${context}

Answer the user's query using only the data above.`
            }
        ];

        return this.generateChat(messages);
    }
}
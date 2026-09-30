import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export function mcpError(error: unknown): { content: Array<{ type: 'text'; text: string }>; isError: true } {
    if (error instanceof McpError) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: error.message, code: error.code }) }], isError: true };
    }
    if (error instanceof Error) {
        const code = mapErrorCode(error.message);
        return { content: [{ type: 'text', text: JSON.stringify({ error: error.message, code }) }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify({ error: 'Unknown error', code: 'INTERNAL_ERROR' }) }], isError: true };
}

function mapErrorCode(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('not found')) return 'RESOURCE_NOT_FOUND';
    if (lower.includes('validation') || lower.includes('zoderror') || lower.includes('invalid')) return 'INVALID_PARAMS';
    if (lower.includes('timeout')) return 'TIMEOUT';
    if (lower.includes('unauthorized') || lower.includes('api key')) return 'UNAUTHORIZED';
    if (lower.includes('rate limit')) return 'RATE_LIMITED';
    return 'INTERNAL_ERROR';
}
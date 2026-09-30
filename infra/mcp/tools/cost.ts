import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CostLogDBRepository } from '../../../src/repositories/cost-log-db.repository.js';
import { GetCostLogSchema } from '../schemas/index.js';
import { mcpError } from '../errors.js';

export function registerCostTools(
    server: McpServer,
    costLogRepo: CostLogDBRepository
) {
    server.registerTool('getCostLog', {
        description: 'Query AI call cost log with optional filters (callType, date range). Returns paginated cost records with USD amounts.',
        inputSchema: GetCostLogSchema,
    }, async ({ callType, from, to, limit = 100 }) => {
        try {
            const filter: any = {};
            if (callType) filter.call_type = callType;

            const allLogs = await costLogRepo.findAll(filter);

            let filtered = allLogs;
            if (from) {
                const fromDate = new Date(from);
                filtered = filtered.filter(log => new Date(log.created_at) >= fromDate);
            }
            if (to) {
                const toDate = new Date(to);
                filtered = filtered.filter(log => new Date(log.created_at) <= toDate);
            }

            const sorted = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            const paginated = sorted.slice(0, limit);

            return { content: [{ type: 'text', text: JSON.stringify({ logs: paginated, total: filtered.length }) }] };
        } catch (error) {
            return mcpError(error);
        }
    });
}
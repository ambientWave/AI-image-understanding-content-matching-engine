import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { JobQueueService } from '../../../src/services/job-queue.service.js';
import { GetJobStatusSchema, ListJobsSchema } from '../schemas/index.js';
import { mcpError } from '../errors.js';

export function registerJobTools(
    server: McpServer,
    jobQueueService: JobQueueService
) {
    server.registerTool('getJobStatus', {
        description: 'Get status of a specific job in a queue (vision, embed, or post-summarize).',
        inputSchema: GetJobStatusSchema,
    }, async ({ queue, id }) => {
        try {
            const status = await jobQueueService.getJobStatus(queue, id);
            return { content: [{ type: 'text', text: JSON.stringify({ jobId: id, queue, status }) }] };
        } catch (error) {
            return mcpError(error);
        }
    });

    server.registerTool('listJobs', {
        description: 'List jobs across queues with optional filters (queue, status, limit).',
        inputSchema: ListJobsSchema,
    }, async ({ queue, status, limit = 100 }) => {
        try {
            const jobs = await jobQueueService.getAllJobs(queue, status, limit);
            return { content: [{ type: 'text', text: JSON.stringify({ jobs, total: jobs.length }) }] };
        } catch (error) {
            return mcpError(error);
        }
    });
}
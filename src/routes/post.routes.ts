import { Router, type Request, type Response, type NextFunction } from 'express';
import { IngestionOrchestratorService } from '../services/ingestion-orchestrator.service.ts';
import { EvaluationService } from '../services/evaluation.service.ts';
import { PostQueryService } from '../services/post-query.service.ts';
import { container } from '../config/container.ts';

const router: Router = Router();
const orchestrator = container.resolve('IngestionOrchestratorService') as IngestionOrchestratorService;
const evaluationService = container.resolve('EvaluationService') as EvaluationService;
const postQueryService = container.resolve('PostQueryService') as PostQueryService;

router.post('/posts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { post_urls } = req.body ?? [];
        if (!post_urls || !Array.isArray(post_urls)) {
            return res.status(400).json({ error: 'post_urls is required' });
        }
        const result = await orchestrator.enqueuePostPipeline(post_urls);
        res.status(202).json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/posts/:id/images', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const resultsNumberParam = req.query.results_number;
        let resultsNumber = 10;
        if (resultsNumberParam) {
            const paramStr = Array.isArray(resultsNumberParam) ? resultsNumberParam[0] : resultsNumberParam;
            if (paramStr) {
                resultsNumber = parseInt(paramStr as string, 10);
            }
        }

        if (!id) {
            return res.status(400).json({ error: 'post id is required' });
        }

        const result = await evaluationService.evaluate(id as string, resultsNumber);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/posts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
        const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
        const status = req.query.status as string | undefined;
        const url_path = req.query.url_path as string | undefined;
        const orderBy = req.query.orderBy as 'created_at' | 'updated_at' | 'url_path' | undefined;
        const orderDir = req.query.orderDir as 'ASC' | 'DESC' | undefined;

        const options: any = {};
        if (limit !== undefined) options.limit = limit;
        if (offset !== undefined) options.offset = offset;
        if (status !== undefined) options.status = status;
        if (url_path !== undefined) options.url_path = url_path;
        if (orderBy !== undefined) options.orderBy = orderBy;
        if (orderDir !== undefined) options.orderDir = orderDir;

        const result = await postQueryService.getPosts(options);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
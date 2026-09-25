import { Router, type Request, type Response, type NextFunction } from 'express';
import { IngestionOrchestratorService } from '../services/ingestion-orchestrator.service.ts';
import { downloadImagesList } from '../services/image-download.service.js';
import { JobQueueService } from '../services/job-queue.service.ts';
import { ImageQueryService } from '../services/image-query.service.ts';
import { container } from '../config/container.ts';

const router: Router = Router();
const orchestrator = container.resolve('IngestionOrchestratorService') as IngestionOrchestratorService;
const jobQueueService = container.resolve('JobQueueService') as JobQueueService;
const imageQueryService = container.resolve('ImageQueryService') as ImageQueryService;

// red fox, wolf, dog, bear, deer
router.get('/download/images', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search } = req.query ?? {};
        if (!search || typeof search !== 'string') {
            return res.status(400).json({ error: 'search is required' });
        }
        res.json(await downloadImagesList(search));
    } catch (err) {
        next(err);
    }
});
/**
 * The rule that resolves this: each layer's job is who's allowed to make decisions.
 * - Routes translate HTTP → a single service call, nothing more — they shouldn't know there's
 *  a list at all, just that a request came in and a response goes out.
 * - Repositories translate one bulk operation → SQL — they can express "insert these N rows" 
 *  as a single query, but they shouldn't contain a for loop calling insert() N times, 
 *  because that's business orchestration wearing a persistence hat.
 * - The service layer is the only place that's actually allowed to say "for each of these, 
 *  do a thing" — that decision is the business logic.
 */
router.post('/images', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image_urls } = req.body ?? [];
        console.log("image_urls", image_urls);
        if (!image_urls || !Array.isArray(image_urls)) {
            return res.status(400).json({ error: 'image_urls is required' });
        }
        const result = await orchestrator.enqueueIngestionPipeline(image_urls);
        res.status(202).json(result);
    } catch (err) {
        next(err);
    }
});


router.get('/images', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
        const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
        const status = req.query.status as string | undefined;
        const url_path = req.query.url_path as string | undefined;
        const filename = req.query.filename as string | undefined;
        const orderBy = req.query.orderBy as 'created_at' | 'updated_at' | 'filename' | undefined;
        const orderDir = req.query.orderDir as 'ASC' | 'DESC' | undefined;

        const options: any = {};
        if (limit !== undefined) options.limit = limit;
        if (offset !== undefined) options.offset = offset;
        if (status !== undefined) options.status = status;
        if (url_path !== undefined) options.url_path = url_path;
        if (filename !== undefined) options.filename = filename;
        if (orderBy !== undefined) options.orderBy = orderBy;
        if (orderDir !== undefined) options.orderDir = orderDir;

        const result = await imageQueryService.getImages(options);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
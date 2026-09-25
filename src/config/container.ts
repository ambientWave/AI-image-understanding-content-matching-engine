import 'reflect-metadata';
import { container } from 'tsyringe';

// Repositories
import { TextEmbedRepository } from '../repositories/text-embed.repository.ts';
import { ImageEmbedRepository } from '../repositories/image-embed.repository.ts';
import { ImageDBRepository } from '../repositories/image-db.repository.ts';
import { ImageUnderstandRepository } from '../repositories/image-understand.repository.ts';
import { PostDBRepository } from '../repositories/post-db.repository.ts';
import { TextSummarizeRepository } from '../repositories/post-summarize.repository.ts';
import { CostLogDBRepository } from '../repositories/cost-log-db.repository.ts';
import { SuggestionDBRepository } from '../repositories/suggestion-db.repository.ts';

// Services
import { TextEmbedService } from '../services/text-embed.service.ts';
import { ImageEmbedService } from '../services/image-embed.service.ts';
import { ImageUnderstandService } from '../services/image-understand.service.ts';
import { IngestionOrchestratorService } from '../services/ingestion-orchestrator.service.ts';
import { JobQueueService } from '../services/job-queue.service.ts';
import { PostDownloadService } from '../services/post-download.service.ts';
import { PostSummarizeService } from '../services/post-summarize.service.ts';
import { PostEmbedService } from '../services/post-embed.service.ts';
import { MatchingService } from '../services/matching.service.ts';
import { EvaluationService } from '../services/evaluation.service.ts';
import { DatabaseInitializerService } from '../services/database-initializer.service.ts';
import { ImageQueryService } from '../services/image-query.service.ts';
import { PostQueryService } from '../services/post-query.service.ts';

// Create repository instances (singletons - models load once)
const textEmbedRepository = new TextEmbedRepository();
const imageEmbedRepository = new ImageEmbedRepository();
const imageDBRepository = new ImageDBRepository();
const imageUnderstandRepository = new ImageUnderstandRepository();
const postDBRepository = new PostDBRepository();
const textSummarizeRepository = new TextSummarizeRepository();
const costLogDBRepository = new CostLogDBRepository();
const suggestionDBRepository = new SuggestionDBRepository();

// Register repositories as values (already instantiated)
container.registerInstance('TextEmbedRepository', textEmbedRepository);
container.registerInstance('ImageEmbedRepository', imageEmbedRepository);
container.registerInstance('ImageDBRepository', imageDBRepository);
container.registerInstance('ImageUnderstandRepository', imageUnderstandRepository);
container.registerInstance('PostDBRepository', postDBRepository);
container.registerInstance('TextSummarizeRepository', textSummarizeRepository);
container.registerInstance('CostLogDBRepository', costLogDBRepository);
container.registerInstance('SuggestionDBRepository', suggestionDBRepository);

// Create service instances with dependencies
const textEmbedService = new TextEmbedService(textEmbedRepository, imageDBRepository, postDBRepository, costLogDBRepository);
const imageEmbedService = new ImageEmbedService(imageEmbedRepository);
const imageUnderstandService = new ImageUnderstandService(imageUnderstandRepository, imageDBRepository, costLogDBRepository);
const postDownloadService = new PostDownloadService();
const postSummarizeService = new PostSummarizeService(textSummarizeRepository, postDBRepository, postDownloadService, costLogDBRepository);
const postEmbedService = new PostEmbedService(textEmbedRepository);
const matchingService = new MatchingService(textEmbedRepository);
const evaluationService = new EvaluationService(matchingService, postDBRepository);
const jobQueueService = new JobQueueService();
const imageQueryService = new ImageQueryService(imageDBRepository);
const postQueryService = new PostQueryService(postDBRepository);
const ingestionOrchestratorService = new IngestionOrchestratorService(
    imageDBRepository,           // 1
    postDBRepository,            // 2
    imageEmbedService,           // 3
    textEmbedService,            // 4
    postEmbedService,            // 5
    jobQueueService,             // 6
    imageUnderstandService,      // 7
    postDownloadService,         // 8
    postSummarizeService         // 9
);

const databaseInitializerService = new DatabaseInitializerService(
    imageDBRepository,
    postDBRepository,
    costLogDBRepository,
    suggestionDBRepository
);

// Register services as values (already instantiated singletons)
container.registerInstance('TextEmbedService', textEmbedService);
container.registerInstance('ImageEmbedService', imageEmbedService);
container.registerInstance('ImageUnderstandService', imageUnderstandService);
container.registerInstance('PostDownloadService', postDownloadService);
container.registerInstance('PostSummarizeService', postSummarizeService);
container.registerInstance('PostEmbedService', postEmbedService);
container.registerInstance('MatchingService', matchingService);
container.registerInstance('EvaluationService', evaluationService);
container.registerInstance('JobQueueService', jobQueueService);
container.registerInstance('ImageQueryService', imageQueryService);
container.registerInstance('PostQueryService', postQueryService);
container.registerInstance('IngestionOrchestratorService', ingestionOrchestratorService);
container.registerInstance('DatabaseInitializerService', databaseInitializerService);

export { container };
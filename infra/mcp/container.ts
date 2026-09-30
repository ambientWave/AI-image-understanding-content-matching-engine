import 'reflect-metadata';
import { container } from 'tsyringe';

// Repositories
import { TextEmbedRepository } from '../../src/repositories/text-embed.repository.js';
import { ImageEmbedRepository } from '../../src/repositories/image-embed.repository.js';
import { ImageDBRepository } from '../../src/repositories/image-db.repository.js';
import { ImageUnderstandRepository } from '../../src/repositories/image-understand.repository.js';
import { PostDBRepository } from '../../src/repositories/post-db.repository.js';
import { TextSummarizeRepository } from '../../src/repositories/post-summarize.repository.js';
import { CostLogDBRepository } from '../../src/repositories/cost-log-db.repository.js';
import { SuggestionDBRepository } from '../../src/repositories/suggestion-db.repository.js';
import { RagRepository } from '../../src/repositories/rag.repository.js';

// Services
import { TextEmbedService } from '../../src/services/text-embed.service.js';
import { ImageEmbedService } from '../../src/services/image-embed.service.js';
import { ImageUnderstandService } from '../../src/services/image-understand.service.js';
import { IngestionOrchestratorService } from '../../src/services/ingestion-orchestrator.service.js';
import { JobQueueService } from '../../src/services/job-queue.service.js';
import { PostDownloadService } from '../../src/services/post-download.service.js';
import { PostSummarizeService } from '../../src/services/post-summarize.service.js';
import { PostEmbedService } from '../../src/services/post-embed.service.js';
import { MatchingService } from '../../src/services/matching.service.js';
import { EvaluationService } from '../../src/services/evaluation.service.js';
import { DatabaseInitializerService } from '../../src/services/database-initializer.service.js';
import { ImageQueryService } from '../../src/services/image-query.service.js';
import { PostQueryService } from '../../src/services/post-query.service.js';
import { RagService } from '../../src/services/rag.service.js';


const textEmbedRepository = new TextEmbedRepository();
const imageEmbedRepository = new ImageEmbedRepository();
const imageDBRepository = new ImageDBRepository();
const imageUnderstandRepository = new ImageUnderstandRepository();
const postDBRepository = new PostDBRepository();
const textSummarizeRepository = new TextSummarizeRepository();
const costLogDBRepository = new CostLogDBRepository();
const suggestionDBRepository = new SuggestionDBRepository();
const ragRepository = new RagRepository();

container.registerInstance('TextEmbedRepository', textEmbedRepository);
container.registerInstance('ImageEmbedRepository', imageEmbedRepository);
container.registerInstance('ImageDBRepository', imageDBRepository);
container.registerInstance('ImageUnderstandRepository', imageUnderstandRepository);
container.registerInstance('PostDBRepository', postDBRepository);
container.registerInstance('TextSummarizeRepository', textSummarizeRepository);
container.registerInstance('CostLogDBRepository', costLogDBRepository);
container.registerInstance('SuggestionDBRepository', suggestionDBRepository);
container.registerInstance('RagRepository', ragRepository);

const textEmbedService = new TextEmbedService(textEmbedRepository, imageDBRepository, postDBRepository, costLogDBRepository);
const imageEmbedService = new ImageEmbedService(imageEmbedRepository);
const imageUnderstandService = new ImageUnderstandService(imageUnderstandRepository, imageDBRepository, costLogDBRepository);
const postDownloadService = new PostDownloadService();
const postSummarizeService = new PostSummarizeService(textSummarizeRepository, postDBRepository, postDownloadService, costLogDBRepository);
const postEmbedService = new PostEmbedService(textEmbedRepository);
const matchingService = new MatchingService(textEmbedRepository);
const ragService = new RagService(ragRepository, costLogDBRepository);
const evaluationService = new EvaluationService(matchingService, postDBRepository, ragService);
const jobQueueService = new JobQueueService();
const imageQueryService = new ImageQueryService(imageDBRepository);
const postQueryService = new PostQueryService(postDBRepository);
const ingestionOrchestratorService = new IngestionOrchestratorService(
    imageDBRepository,
    postDBRepository,
    imageEmbedService,
    textEmbedService,
    postEmbedService,
    jobQueueService,
    imageUnderstandService,
    postDownloadService,
    postSummarizeService
);

const databaseInitializerService = new DatabaseInitializerService(
    imageDBRepository,
    postDBRepository,
    costLogDBRepository,
    suggestionDBRepository
);

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
container.registerInstance('RagService', ragService);
container.registerInstance('IngestionOrchestratorService', ingestionOrchestratorService);
container.registerInstance('DatabaseInitializerService', databaseInitializerService);

await databaseInitializerService.initializeAll();

export { container };
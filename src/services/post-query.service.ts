import { injectable } from 'tsyringe';
import { PostDBRepository, type PostRow, type PostRowFilter } from '../repositories/post-db.repository.ts';

export interface QueryOptions {
    limit?: number;
    offset?: number;
    status?: string;
    url_path?: string;
    orderBy?: 'created_at' | 'updated_at' | 'url_path';
    orderDir?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

@injectable()
export class PostQueryService {
    constructor(
        private postDBRepository: PostDBRepository
    ) { }

    async getPosts(options: QueryOptions = {}): Promise<PaginatedResult<PostRow>> {
        const limit = Math.min(options.limit ?? 50, 100);
        const offset = options.offset ?? 0;
        const orderBy = options.orderBy ?? 'created_at';
        const orderDir = options.orderDir ?? 'DESC';

        const filter: PostRowFilter = {};
        if (options.status) filter.status = options.status;
        if (options.url_path) filter.url_path = options.url_path;

        const [data, total] = await Promise.all([
            this.postDBRepository.findAll(filter),
            this.postDBRepository.count(filter)
        ]);

        const sortedData = data.sort((a, b) => {
            const aVal = a[orderBy];
            const bVal = b[orderBy];
            if (orderDir === 'ASC') {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });

        const paginatedData = sortedData.slice(offset, offset + limit);

        return {
            data: paginatedData,
            total,
            limit,
            offset,
            hasMore: offset + limit < total
        };
    }
}
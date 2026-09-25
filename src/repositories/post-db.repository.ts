import { injectable } from 'tsyringe';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export interface PostRowPreInsertion {
    url_path: string;
    title?: string;
}

export interface PostRow {
    id: string;
    url_path: string;
    summary: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface PostRowFilter {
    url_path?: string;
    status?: string;
}

@injectable()
export class PostDBRepository {
    private pool: Pool;

    constructor(connectionString?: string) {
        this.pool = new Pool({
            connectionString: connectionString || process.env.DATABASE_URL
        });
    }

    public async initDB(retries = 10, delayMs = 3000): Promise<void> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await this.pool.query(`
                    CREATE TABLE IF NOT EXISTS "post" (
                        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        "url_path" TEXT NOT NULL,
                        "summary" TEXT,
                        "status" TEXT NOT NULL DEFAULT 'pending',
                        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
                    )
                `);
                console.log('[Database] post table initialized and ready.');
                return;
            } catch (err) {
                console.error(`[Database] Init attempt ${attempt}/${retries} failed. Retrying in ${delayMs / 1000}s...`);
                if (attempt < retries) {
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                } else {
                    console.error('[Database] All initialization attempts failed.');
                    throw err;
                }
            }
        }
    }

    async findAll(filter?: PostRowFilter): Promise<PostRow[]> {
        const conditions: string[] = [];
        const params: (string | number)[] = [];

        if (filter?.url_path !== undefined && filter.url_path.trim() !== '') {
            conditions.push(`url_path = $${params.length + 1}`);
            params.push(filter.url_path.trim());
        }

        if (filter?.status !== undefined && filter.status.trim() !== '') {
            conditions.push(`status = $${params.length + 1}`);
            params.push(filter.status.trim());
        }

        let sql = 'SELECT id, url_path, summary, status, created_at, updated_at FROM post';
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }
        sql += ' ORDER BY created_at DESC';

        const result = await this.pool.query<PostRow>(sql, params);
        return result.rows;
    }

    async findById(id: string): Promise<PostRow | undefined> {
        const result = await this.pool.query<PostRow>(
            'SELECT id, url_path, summary, status, created_at, updated_at FROM post WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    async findByIds(ids: string[]): Promise<PostRow[] | undefined> {
        const result = await this.pool.query<PostRow>(
            'SELECT id, url_path, summary, status, created_at, updated_at FROM post WHERE id = ANY($1::uuid[])',
            [ids]
        );
        const posts: PostRow[] = [];
        for (const id of ids) {
            const post = result.rows.find((post) => post.id === id);
            if (post) {
                posts.push(post);
            }
        }
        return posts;
    }

    async insert(posts: PostRowPreInsertion[]): Promise<PostRow[]> {
        if (!posts || posts.length === 0) return [];

        const url_paths = posts.map(i => i.url_path);
        const created_ats = posts.map(() => new Date().toISOString());
        const updated_ats = posts.map(() => new Date().toISOString());

        const result = await this.pool.query<PostRow>(
            `INSERT INTO post (url_path, status, created_at, updated_at) 
             SELECT * FROM UNNEST($1::text[], $2::text[], $3::timestamptz[], $4::timestamptz[])
             RETURNING id, url_path, summary, status, created_at, updated_at`,
            [url_paths, posts.map(() => 'pending'), created_ats, updated_ats]
        );
        return result.rows;
    }

    async update(ids: string[], changes: Partial<{ status: string, summary: string }>): Promise<PostRow[]> {
        if (!ids || ids.length === 0) return [];

        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (changes.status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            params.push(changes.status);
        }

        if (changes.summary !== undefined) {
            updates.push(`summary = $${paramIndex++}`);
            params.push(changes.summary);
        }

        if (updates.length === 0) {
            return (await this.findByIds(ids)) || [];
        }

        updates.push(`updated_at = $${paramIndex++}`);
        params.push(new Date().toISOString());

        params.push(ids);

        const sql = `
            UPDATE post 
            SET ${updates.join(', ')} 
            WHERE id = ANY($${paramIndex}::uuid[]) 
            RETURNING id, url_path, summary, status, created_at, updated_at
        `;

        const result = await this.pool.query<PostRow>(sql, params);
        return result.rows;
    }

    async updateStatus(ids: string[], status: string): Promise<PostRow[]> {
        if (!ids || ids.length === 0) return [];

        const result = await this.pool.query<PostRow>(
            `UPDATE post 
             SET status = $1, updated_at = now() 
             WHERE id = ANY($2::uuid[]) 
             RETURNING id, url_path, summary, status, created_at, updated_at`,
            [status, ids]
        );
        return result.rows;
    }

    async saveSummary(postId: string, summary: string): Promise<PostRow[]> {
        const result = await this.pool.query<PostRow>(
            `UPDATE post 
             SET summary = $1, status = 'summarized', updated_at = now() 
             WHERE id = $2 
             RETURNING id, url_path, summary, status, created_at, updated_at`,
            [summary, postId]
        );
        return result.rows;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM post WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }

    async count(filter?: PostRowFilter): Promise<number> {
        const conditions: string[] = [];
        const params: (string | number)[] = [];

        if (filter?.url_path !== undefined && filter.url_path.trim() !== '') {
            conditions.push(`url_path = $${params.length + 1}`);
            params.push(filter.url_path.trim());
        }

        if (filter?.status !== undefined && filter.status.trim() !== '') {
            conditions.push(`status = $${params.length + 1}`);
            params.push(filter.status.trim());
        }

        let sql = 'SELECT COUNT(*) FROM post';
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        const result = await this.pool.query(sql, params);
        return parseInt(result.rows[0].count, 10);
    }
}

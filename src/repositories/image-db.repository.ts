import { injectable } from 'tsyringe';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export interface ImageRowPreInsertion {
    filename: string;
    url_path: string;
    status: string;
}

export interface ImageRow {
    id: string;
    filename: string;
    url_path: string;
    tag?: any | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface ImageRowFilter {
    url_path?: string;
    filename?: string;
    status?: string;
}

export interface ImageRepository {
    findAll(): Promise<ImageRow[]>;
    findById(id: number): Promise<ImageRow | undefined>;
    insert(image: ImageRow): Promise<ImageRow>;
    update(id: number, image: ImageRow): Promise<ImageRow | null>;
    delete(id: number): Promise<boolean>;
}

@injectable()
export class ImageDBRepository {
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
                    CREATE TABLE IF NOT EXISTS "image" (
                        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        "filename" TEXT NOT NULL,
                        "url_path" TEXT NOT NULL,
                        "tag" JSONB,
                        "status" TEXT NOT NULL DEFAULT 'pending',
                        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
                    )
                `);
                console.log('[Database] image table initialized and ready.');
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

    async findAll(filter?: ImageRowFilter): Promise<ImageRow[]> {
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

        if (filter?.filename !== undefined && filter.filename.trim() !== '') {
            conditions.push(`filename = $${params.length + 1}`);
            params.push(filter.filename.trim());
        }

        let sql = 'SELECT id, filename, url_path, tag, status, created_at, updated_at FROM image';
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }
        sql += ' ORDER BY LOWER(filename) ASC, id ASC';

        const result = await this.pool.query<ImageRow>(sql, params);
        return result.rows;
    }

    async findByIds(ids: string[]): Promise<ImageRow[] | undefined> {
        const result = await this.pool.query<ImageRow>(
            'SELECT id, filename, url_path, tag, status, created_at, updated_at FROM image WHERE id = ANY($1::uuid[])',
            [ids]
        );
        const images: ImageRow[] = [];
        for (const id of ids) {
            const image = result.rows.find((image) => image.id === id);
            if (image) {
                images.push(image);
            }
        }
        return images;
    }

    async findById(id: string): Promise<ImageRow | undefined> {
        const result = await this.pool.query<ImageRow>(
            'SELECT id, filename, url_path, tag, status, created_at, updated_at FROM image WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    async insert(images: ImageRowPreInsertion[]): Promise<ImageRow[]> {
        if (!images || images.length === 0) return [];

        const filenames = images.map(i => i.filename);
        const url_paths = images.map(i => i.url_path);
        const statuses = images.map(i => i.status || 'pending');
        const created_ats = images.map(() => new Date().toISOString());
        const updated_ats = images.map(() => new Date().toISOString());

        const result = await this.pool.query<ImageRow>(
            `INSERT INTO image (filename, url_path, status, created_at, updated_at) 
             SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::timestamptz[], $5::timestamptz[])
             RETURNING id, filename, url_path, status, created_at, updated_at`,
            [filenames, url_paths, statuses, created_ats, updated_ats]
        );
        return result.rows;
    }

    async update(ids: string[], changes: Partial<{ status: string; tag: any }>): Promise<ImageRow[]> {
        if (!ids || ids.length === 0) return [];

        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (changes.status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            params.push(changes.status);
        }

        if (changes.tag !== undefined) {
            updates.push(`tag = $${paramIndex++}`);
            params.push(changes.tag);
        }

        if (updates.length === 0) {
            return (await this.findByIds(ids)) || [];
        }

        updates.push(`updated_at = $${paramIndex++}`);
        params.push(new Date().toISOString());

        params.push(ids);

        const sql = `
            UPDATE image 
            SET ${updates.join(', ')} 
            WHERE id = ANY($${paramIndex}::uuid[]) 
            RETURNING id, filename, url_path, tag, status, created_at, updated_at
        `;

        const result = await this.pool.query<ImageRow>(sql, params);
        return result.rows;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM image WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }

    async count(filter?: ImageRowFilter): Promise<number> {
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

        if (filter?.filename !== undefined && filter.filename.trim() !== '') {
            conditions.push(`filename = $${params.length + 1}`);
            params.push(filter.filename.trim());
        }

        let sql = 'SELECT COUNT(*) FROM image';
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        const result = await this.pool.query(sql, params);
        return parseInt(result.rows[0].count, 10);
    }
}
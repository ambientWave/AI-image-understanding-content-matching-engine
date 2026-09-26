import { injectable } from 'tsyringe';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export interface CostLogRowPreInsertion {
    call_type: string;
    ref_id: string;
    tokens_or_units: number;
    cost_usd: number;
}

export interface CostLogRow {
    id: string;
    call_type: string;
    ref_id: string;
    tokens_or_units: number;
    cost_usd: number;
    created_at: string;
    updated_at: string;
}

export interface CostLogRowFilter {
    ref_id?: string;
    call_type?: string;
    tokens_or_units?: number;
    cost_usd?: number;
}

export interface CostLogRepository {
    findAll(): Promise<CostLogRow[]>;
    findById(id: number): Promise<CostLogRow | undefined>;
    insert(costLog: CostLogRowPreInsertion): Promise<CostLogRow>;
    insertMany(costLogs: CostLogRowPreInsertion[]): Promise<CostLogRow[]>;
    update(id: number, image: CostLogRow): Promise<CostLogRow | null>;
    delete(id: number): Promise<boolean>;
}

@injectable()
export class CostLogDBRepository {
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
                    CREATE TABLE IF NOT EXISTS cost_log (
                        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        call_type     TEXT NOT NULL CHECK (call_type in ('vision','embedding','summarization','rag')),
                        ref_id        UUID NOT NULL,       -- image_id or post_id
                        tokens_or_units NUMERIC NOT NULL,
                        cost_usd      NUMERIC(10,6) NOT NULL,
                        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
                    );
                    CREATE INDEX IF NOT EXISTS idx_cost_log_call_type 
                        ON cost_log (call_type);
                `);
                console.log('[Database] cost_log table initialized and ready.');
                return;
            } catch (err) {
                console.error(`[Database] Init attempt ${attempt}/${retries} failed. Retrying in ${delayMs / 1000}s...`);
                if (attempt < retries) {
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                } else {
                    console.error('[Database] All initialization attempts failed.');
                    /**
                     * If all 10 retries fail → throw err → unhandled rejection → process crashes with non-zero exit
                     * restart: on-failure in compose.yaml,
                     * Docker automatically restarts the api container
                     */
                    throw err;
                }
            }
        }
    }

    async findAll(filter?: CostLogRowFilter): Promise<CostLogRow[]> {
        const conditions: string[] = [];
        const params: (string | number)[] = [];

        if (filter?.ref_id !== undefined && filter.ref_id.trim() !== '') {
            conditions.push(`ref_id = $${params.length + 1}`);
            params.push(filter.ref_id.trim());
        }

        if (filter?.call_type !== undefined && filter.call_type.trim() !== '') {
            conditions.push(`call_type = $${params.length + 1}`);
            params.push(filter.call_type.trim());
        }

        if (filter?.tokens_or_units !== undefined && filter.tokens_or_units !== 0) {
            conditions.push(`tokens_or_units = $${params.length + 1}`);
            params.push(filter.tokens_or_units);
        }

        if (filter?.cost_usd !== undefined && filter.cost_usd !== 0) {
            conditions.push(`cost_usd = $${params.length + 1}`);
            params.push(filter.cost_usd);
        }

        let sql = 'SELECT id, call_type, ref_id, tokens_or_units, cost_usd, created_at, updated_at FROM cost_log';
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }
        sql += ' ORDER BY created_at ASC, id ASC';

        const result = await this.pool.query<CostLogRow>(sql, params);
        return result.rows;
    }

    async findByIds(ids: string[]): Promise<CostLogRow[] | undefined> {
        const result = await this.pool.query<CostLogRow>(
            'SELECT id, call_type, ref_id, tokens_or_units, cost_usd, created_at, updated_at FROM cost_log WHERE id = ANY($1::uuid[])',
            [ids]
        );
        const costLogs: CostLogRow[] = [];
        for (const id of ids) {
            const costLog = result.rows.find((costLog) => costLog.id === id);
            if (costLog) {
                costLogs.push(costLog);
            }
        }
        return costLogs;
    }

    async insert(costLog: CostLogRowPreInsertion): Promise<CostLogRow> {
        const created_at = new Date().toISOString();
        const updated_at = new Date().toISOString();

        const result = await this.pool.query<CostLogRow>(
            `INSERT INTO cost_log (call_type, ref_id, tokens_or_units, cost_usd, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, call_type, ref_id, tokens_or_units, cost_usd, created_at, updated_at`,
            [costLog.call_type, costLog.ref_id, costLog.tokens_or_units, costLog.cost_usd, created_at, updated_at]
        );
        if (!result.rows[0]) {
            throw new Error('Failed to insert cost log');
        }
        return result.rows[0];
    }

    async insertMany(costLogs: CostLogRowPreInsertion[]): Promise<CostLogRow[]> {
        if (!costLogs || costLogs.length === 0) return [];

        const call_types = costLogs.map(i => i.call_type);
        const ref_ids = costLogs.map(i => i.ref_id);
        const tokens_or_units = costLogs.map(i => i.tokens_or_units);
        const cost_usds = costLogs.map(i => i.cost_usd);
        const created_ats = costLogs.map(() => new Date().toISOString());
        const updated_ats = costLogs.map(() => new Date().toISOString());

        const result = await this.pool.query<CostLogRow>(
            `INSERT INTO cost_log (call_type, ref_id, tokens_or_units, cost_usd, created_at, updated_at) 
             SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::timestamptz[], $5::timestamptz[], $6::timestamptz[])
             RETURNING id, call_type, ref_id, tokens_or_units, cost_usd, created_at, updated_at`,
            [call_types, ref_ids, tokens_or_units, cost_usds, created_ats, updated_ats]
        );
        return result.rows;
    }

    async update(ids: string[], changes: Partial<{ tokens_or_units: number, cost_usd: number }>): Promise<CostLogRow[]> {
        if (!ids || ids.length === 0) return [];

        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (changes.tokens_or_units !== undefined) {
            updates.push(`tokens_or_units = $${paramIndex++}`);
            params.push(changes.tokens_or_units);
        }
        if (changes.cost_usd !== undefined) {
            updates.push(`cost_usd = $${paramIndex++}`);
            params.push(changes.cost_usd);
        }

        if (updates.length === 0) {
            return (await this.findByIds(ids)) || [];
        }

        updates.push(`updated_at = $${paramIndex++}`);
        params.push(new Date().toISOString());

        params.push(ids);

        const sql = `
            UPDATE cost_log 
            SET ${updates.join(', ')} 
            WHERE id = ANY($${paramIndex}::uuid[]) 
            RETURNING id, call_type, ref_id, tokens_or_units, cost_usd, created_at, updated_at
        `;

        const result = await this.pool.query<CostLogRow>(sql, params);
        return result.rows;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM cost_log WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }
}
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCacheTokensToUsageLog1736300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 添加缓存相关的 token 字段
        await queryRunner.query(`
            ALTER TABLE usage_log ADD COLUMN cacheReadTokens INTEGER NULL;
        `)
        await queryRunner.query(`
            ALTER TABLE usage_log ADD COLUMN cacheCreationTokens INTEGER NULL;
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // SQLite 不支持 DROP COLUMN，需要重建表
        // 这里简化处理，实际回滚时可能需要更复杂的操作
        await queryRunner.query(`
            CREATE TABLE usage_log_backup AS SELECT 
                id, userId, chatflowId, provider, model, 
                inputTokens, outputTokens, totalTokens, cost, 
                latencyMs, status, errorMessage, deletedByUser, createdAt
            FROM usage_log;
        `)
        await queryRunner.query(`DROP TABLE usage_log;`)
        await queryRunner.query(`ALTER TABLE usage_log_backup RENAME TO usage_log;`)
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSystemConfig1736400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS system_config (
                id varchar PRIMARY KEY NOT NULL,
                key varchar NOT NULL UNIQUE,
                value text NOT NULL,
                description text,
                isEncrypted boolean DEFAULT 0,
                createdDate datetime NOT NULL DEFAULT (datetime('now')),
                updatedDate datetime NOT NULL DEFAULT (datetime('now'))
            );
        `)

        // 创建索引
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_SYSTEM_CONFIG_KEY ON system_config (key);
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS IDX_SYSTEM_CONFIG_KEY`)
        await queryRunner.query(`DROP TABLE IF EXISTS system_config`)
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDeletedByUserToUsageLog1735500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 检查列是否已存在
        const table = await queryRunner.query(`PRAGMA table_info("usage_log");`)
        const hasColumn = table.some((col: any) => col.name === 'deletedByUser')

        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "usage_log" ADD COLUMN "deletedByUser" boolean DEFAULT 0;`)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // SQLite 不支持 DROP COLUMN，需要重建表
        // 这里简单处理，不做回滚
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddQuotaWarningFields1735600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 检查列是否已存在
        const table = await queryRunner.query(`PRAGMA table_info("user");`)

        const hasWarningThreshold = table.some((col: any) => col.name === 'quotaWarningThreshold')
        const hasWarningNotified = table.some((col: any) => col.name === 'quotaWarningNotified')

        if (!hasWarningThreshold) {
            await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "quotaWarningThreshold" integer DEFAULT 80;`)
        }
        if (!hasWarningNotified) {
            await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "quotaWarningNotified" boolean DEFAULT 0;`)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // SQLite 不支持 DROP COLUMN
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProviderToSystemConfig1736500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 添加 provider 列到 system_config 表
        await queryRunner.query(`
            ALTER TABLE system_config ADD COLUMN provider TEXT
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // SQLite 不支持直接删除列，需要重建表
        // 这里简化处理，实际生产环境可能需要更复杂的回滚逻辑
        console.log('Rollback: provider column cannot be easily removed in SQLite')
    }
}

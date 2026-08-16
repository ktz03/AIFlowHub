import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserIdToChatFlow1736000000000 implements MigrationInterface {
    name = 'AddUserIdToChatFlow1736000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 添加 userId 字段到 chat_flow 表
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD COLUMN "userId" varchar(36)`)

        // 创建索引以提高查询性能
        await queryRunner.query(`CREATE INDEX "IDX_chat_flow_userId" ON "chat_flow" ("userId")`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_chat_flow_userId"`)
        await queryRunner.query(`ALTER TABLE "chat_flow" DROP COLUMN "userId"`)
    }
}

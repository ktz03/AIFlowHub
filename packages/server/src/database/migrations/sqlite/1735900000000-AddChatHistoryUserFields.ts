import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddChatHistoryUserFields1735900000000 implements MigrationInterface {
    name = 'AddChatHistoryUserFields1735900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 为 ChatMessage 表添加 userId 字段
        await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN "userId" varchar(36);`)

        // 添加 title 字段用于会话标题
        await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN "sessionTitle" varchar(255);`)

        // 添加索引
        await queryRunner.query(`CREATE INDEX "IDX_chat_message_userId" ON "chat_message" ("userId");`)
        await queryRunner.query(`CREATE INDEX "IDX_chat_message_sessionId" ON "chat_message" ("sessionId");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_chat_message_sessionId";`)
        await queryRunner.query(`DROP INDEX "IDX_chat_message_userId";`)
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "sessionTitle";`)
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "userId";`)
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserIdToEntities1736100000000 implements MigrationInterface {
    name = 'AddUserIdToEntities1736100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 添加 userId 字段到 credential 表
        await queryRunner.query(`ALTER TABLE "credential" ADD COLUMN "userId" varchar(36)`)
        await queryRunner.query(`CREATE INDEX "IDX_credential_userId" ON "credential" ("userId")`)

        // 添加 userId 字段到 tool 表
        await queryRunner.query(`ALTER TABLE "tool" ADD COLUMN "userId" varchar(36)`)
        await queryRunner.query(`CREATE INDEX "IDX_tool_userId" ON "tool" ("userId")`)

        // 添加 userId 字段到 variable 表
        await queryRunner.query(`ALTER TABLE "variable" ADD COLUMN "userId" varchar(36)`)
        await queryRunner.query(`CREATE INDEX "IDX_variable_userId" ON "variable" ("userId")`)

        // 添加 userId 字段到 apikey 表
        await queryRunner.query(`ALTER TABLE "apikey" ADD COLUMN "userId" varchar(36)`)
        await queryRunner.query(`CREATE INDEX "IDX_apikey_userId" ON "apikey" ("userId")`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_apikey_userId"`)
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "userId"`)

        await queryRunner.query(`DROP INDEX "IDX_variable_userId"`)
        await queryRunner.query(`ALTER TABLE "variable" DROP COLUMN "userId"`)

        await queryRunner.query(`DROP INDEX "IDX_tool_userId"`)
        await queryRunner.query(`ALTER TABLE "tool" DROP COLUMN "userId"`)

        await queryRunner.query(`DROP INDEX "IDX_credential_userId"`)
        await queryRunner.query(`ALTER TABLE "credential" DROP COLUMN "userId"`)
    }
}

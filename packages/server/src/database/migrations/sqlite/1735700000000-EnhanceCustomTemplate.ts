import { MigrationInterface, QueryRunner } from 'typeorm'

export class EnhanceCustomTemplate1735700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 添加新字段到 custom_template 表
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "userId" TEXT;`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "category" TEXT;`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "tags" TEXT;`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "isPublic" INTEGER DEFAULT 0;`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "useCount" INTEGER DEFAULT 0;`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "likeCount" INTEGER DEFAULT 0;`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "viewCount" INTEGER DEFAULT 0;`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "thumbnail" TEXT;`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "author" TEXT;`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "version" TEXT DEFAULT '1.0.0';`)

        // 创建模板收藏表
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "template_favorite" (
                "id" VARCHAR PRIMARY KEY NOT NULL,
                "userId" VARCHAR NOT NULL,
                "templateId" VARCHAR NOT NULL,
                "createdDate" DATETIME DEFAULT (datetime('now')),
                UNIQUE("userId", "templateId")
            );
        `)

        // 创建模板评分表
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "template_rating" (
                "id" VARCHAR PRIMARY KEY NOT NULL,
                "userId" VARCHAR NOT NULL,
                "templateId" VARCHAR NOT NULL,
                "rating" INTEGER NOT NULL,
                "comment" TEXT,
                "createdDate" DATETIME DEFAULT (datetime('now')),
                "updatedDate" DATETIME DEFAULT (datetime('now')),
                UNIQUE("userId", "templateId")
            );
        `)

        // 创建索引
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_template_category" ON "custom_template" ("category");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_template_isPublic" ON "custom_template" ("isPublic");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_template_userId" ON "custom_template" ("userId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_favorite_userId" ON "template_favorite" ("userId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_favorite_templateId" ON "template_favorite" ("templateId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_rating_templateId" ON "template_rating" ("templateId");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 删除索引
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_rating_templateId";`)
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_favorite_templateId";`)
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_favorite_userId";`)
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_template_userId";`)
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_template_isPublic";`)
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_template_category";`)

        // 删除表
        await queryRunner.query(`DROP TABLE IF EXISTS "template_rating";`)
        await queryRunner.query(`DROP TABLE IF EXISTS "template_favorite";`)

        // 注意：SQLite 不支持 DROP COLUMN，需要重建表
        // 这里简化处理，实际生产环境需要更复杂的迁移
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddModelEvaluation1735800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "model_evaluation" (
                "id" VARCHAR PRIMARY KEY NOT NULL,
                "userId" VARCHAR NOT NULL,
                "testInput" TEXT NOT NULL,
                "results" TEXT NOT NULL,
                "title" VARCHAR,
                "notes" TEXT,
                "createdDate" DATETIME DEFAULT (datetime('now'))
            );
        `)

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_evaluation_userId" ON "model_evaluation" ("userId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_evaluation_createdDate" ON "model_evaluation" ("createdDate");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_evaluation_createdDate";`)
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_evaluation_userId";`)
        await queryRunner.query(`DROP TABLE IF EXISTS "model_evaluation";`)
    }
}

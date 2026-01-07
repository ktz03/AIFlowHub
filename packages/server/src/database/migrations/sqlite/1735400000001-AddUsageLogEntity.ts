import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUsageLogEntity1735400000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "usage_log" (
                "id" varchar PRIMARY KEY NOT NULL,
                "userId" varchar NOT NULL,
                "chatflowId" varchar,
                "provider" varchar(50) NOT NULL,
                "model" varchar(50) NOT NULL,
                "inputTokens" integer NOT NULL DEFAULT 0,
                "outputTokens" integer NOT NULL DEFAULT 0,
                "totalTokens" integer NOT NULL DEFAULT 0,
                "cost" decimal(10,6) NOT NULL DEFAULT 0,
                "latencyMs" integer,
                "status" varchar(20) NOT NULL DEFAULT 'success',
                "errorMessage" text,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE
            );`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_usage_log_userId" ON "usage_log" ("userId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_usage_log_chatflowId" ON "usage_log" ("chatflowId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_usage_log_createdAt" ON "usage_log" ("createdAt");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_usage_log_createdAt";`)
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_usage_log_chatflowId";`)
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_usage_log_userId";`)
        await queryRunner.query(`DROP TABLE IF EXISTS "usage_log";`)
    }
}

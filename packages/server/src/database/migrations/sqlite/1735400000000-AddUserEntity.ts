import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserEntity1735400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 先检查表是否存在，如果存在但结构不对则删除重建
        const tableExists = await queryRunner.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='user';`)

        if (tableExists.length > 0) {
            // 检查是否有 username 列
            const columns = await queryRunner.query(`PRAGMA table_info(user);`)
            const hasUsername = columns.some((col: any) => col.name === 'username')

            if (!hasUsername) {
                // 表存在但没有 username 列，删除旧表
                await queryRunner.query(`DROP TABLE "user";`)
            }
        }

        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "user" (
                "id" varchar PRIMARY KEY NOT NULL,
                "username" varchar(50) NOT NULL,
                "email" varchar(100) NOT NULL,
                "password" varchar(255) NOT NULL,
                "role" varchar(20) NOT NULL DEFAULT 'user',
                "status" varchar(20) NOT NULL DEFAULT 'active',
                "quotaLimit" integer NOT NULL DEFAULT 100000,
                "quotaUsed" integer NOT NULL DEFAULT 0,
                "quotaResetAt" datetime,
                "lastLoginAt" datetime,
                "refreshToken" varchar(255),
                "resetPasswordToken" varchar(255),
                "resetPasswordExpires" datetime,
                "emailVerificationToken" varchar(255),
                "isEmailVerified" boolean NOT NULL DEFAULT 0,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
            );`
        )
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_username" ON "user" ("username");`)
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_email" ON "user" ("email");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_email";`)
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_username";`)
        await queryRunner.query(`DROP TABLE IF EXISTS "user";`)
    }
}

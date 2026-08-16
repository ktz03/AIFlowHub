import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserIdToDocStoreAssistant1736200000000 implements MigrationInterface {
    name = 'AddUserIdToDocStoreAssistant1736200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add userId column to document_store table
        await queryRunner.query(`ALTER TABLE "document_store" ADD COLUMN "userId" varchar`)

        // Add userId column to assistant table
        await queryRunner.query(`ALTER TABLE "assistant" ADD COLUMN "userId" varchar`)

        // Create indexes for better query performance
        await queryRunner.query(`CREATE INDEX "IDX_document_store_userId" ON "document_store" ("userId")`)
        await queryRunner.query(`CREATE INDEX "IDX_assistant_userId" ON "assistant" ("userId")`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_assistant_userId"`)
        await queryRunner.query(`DROP INDEX "IDX_document_store_userId"`)

        // Remove userId columns
        await queryRunner.query(`ALTER TABLE "assistant" DROP COLUMN "userId"`)
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "userId"`)
    }
}

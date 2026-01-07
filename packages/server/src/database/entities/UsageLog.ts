import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './User'

export enum UsageStatus {
    SUCCESS = 'success',
    FAILED = 'failed'
}

@Entity('usage_log')
export class UsageLog {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'uuid' })
    @Index()
    userId: string

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User

    @Column({ type: 'uuid', nullable: true })
    @Index()
    chatflowId: string

    @Column({ type: 'varchar', length: 50 })
    provider: string

    @Column({ type: 'varchar', length: 50 })
    model: string

    @Column({ type: 'int', default: 0 })
    inputTokens: number

    @Column({ type: 'int', default: 0 })
    outputTokens: number

    @Column({ type: 'int', default: 0 })
    totalTokens: number

    @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
    cost: number

    @Column({ type: 'int', nullable: true })
    latencyMs: number

    @Column({ type: 'varchar', length: 20, default: UsageStatus.SUCCESS })
    status: UsageStatus

    @Column({ type: 'text', nullable: true })
    errorMessage: string

    @Column({ type: 'boolean', default: false })
    deletedByUser: boolean // 用户软删除标记，管理员仍可查看

    @CreateDateColumn()
    @Index()
    createdAt: Date
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending'
}

@Entity('user')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 50, unique: true })
    @Index()
    username: string

    @Column({ type: 'varchar', length: 100, unique: true })
    @Index()
    email: string

    @Column({ type: 'varchar', length: 255 })
    password: string

    @Column({ type: 'varchar', length: 20, default: UserRole.USER })
    role: UserRole

    @Column({ type: 'varchar', length: 20, default: UserStatus.ACTIVE })
    status: UserStatus

    @Column({ type: 'int', default: 100000 })
    quotaLimit: number

    @Column({ type: 'int', default: 0 })
    quotaUsed: number

    @Column({ type: 'int', default: 80 })
    quotaWarningThreshold: number

    @Column({ type: 'boolean', default: false })
    quotaWarningNotified: boolean

    @Column({ type: 'timestamp', nullable: true })
    quotaResetAt: Date

    @Column({ type: 'timestamp', nullable: true })
    lastLoginAt: Date

    @Column({ type: 'varchar', length: 255, nullable: true })
    refreshToken: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    resetPasswordToken: string

    @Column({ type: 'timestamp', nullable: true })
    resetPasswordExpires: Date

    @Column({ type: 'varchar', length: 255, nullable: true })
    emailVerificationToken: string

    @Column({ type: 'boolean', default: false })
    isEmailVerified: boolean

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}

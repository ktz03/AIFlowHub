import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class SystemConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ unique: true })
    key: string

    @Column({ type: 'text' })
    value: string

    @Column({ type: 'text', nullable: true })
    description?: string

    @Column({ default: false })
    isEncrypted: boolean

    @Column({ type: 'text', nullable: true })
    provider?: string

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date
}

import { ICustomTemplate } from '../../Interface'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('custom_template')
export class CustomTemplate implements ICustomTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    name: string

    @Column({ type: 'text' })
    flowData: string

    @Column({ nullable: true, type: 'text' })
    description?: string

    @Column({ nullable: true, type: 'text' })
    badge?: string

    @Column({ nullable: true, type: 'text' })
    framework?: string

    @Column({ nullable: true, type: 'text' })
    usecases?: string

    @Column({ nullable: true, type: 'text' })
    type?: string

    // 新增字段
    @Column({ nullable: true })
    userId?: string

    @Column({ nullable: true, type: 'text' })
    category?: string

    @Column({ nullable: true, type: 'text' })
    tags?: string

    @Column({ default: false })
    isPublic?: boolean

    @Column({ default: 0 })
    useCount?: number

    @Column({ default: 0 })
    likeCount?: number

    @Column({ default: 0 })
    viewCount?: number

    @Column({ nullable: true, type: 'text' })
    thumbnail?: string

    @Column({ nullable: true, type: 'text' })
    author?: string

    @Column({ nullable: true, default: '1.0.0' })
    version?: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedDate: Date
}

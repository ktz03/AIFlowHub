import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('template_favorite')
export class TemplateFavorite {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    userId: string

    @Column()
    templateId: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date
}

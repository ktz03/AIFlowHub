import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('model_evaluation')
export class ModelEvaluation {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    userId: string

    @Column({ type: 'text' })
    testInput: string

    @Column({ type: 'text' })
    results: string // JSON string of evaluation results

    @Column({ nullable: true })
    title?: string

    @Column({ nullable: true, type: 'text' })
    notes?: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date
}

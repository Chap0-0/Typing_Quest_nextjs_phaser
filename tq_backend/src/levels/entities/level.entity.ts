import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Result } from '../../results/entities/result.entity';

@Entity('levels')
export class Level {
  @PrimaryGeneratedColumn()
  level_id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer', nullable: true })
  difficulty: number;

  @Column({ type: 'integer' })
  time_limit: number;

  @Column({ type: 'jsonb' })
  data: {
    sequences: string[];
    enemies: Array<{
      type: string;
      position: number;
      speed: number;
    }>;
    bonuses: Array<{
      type: string;
      position: number;
      effect: string;
    }>;
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @OneToMany(() => Result, (result) => result.level)
  results: Result[];
}
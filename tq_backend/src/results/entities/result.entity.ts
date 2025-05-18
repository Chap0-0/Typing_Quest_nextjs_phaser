import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Level } from '../../levels/entities/level.entity';

@Entity('results')
export class Result {
  @PrimaryGeneratedColumn()
  result_id: number;

  @ManyToOne(() => User, (user) => user.results)
  user: User;

  @Column()
  user_id: number;

  @ManyToOne(() => Level, (level) => level.results)
  level: Level;

  @Column()
  level_id: number;

  @Column({ type: 'integer' })
  wpm: number;

  @Column({ type: 'numeric' })
  accuracy: number;

  @Column({ type: 'integer' })
  completion_time: number;

  @Column({ type: 'integer' })
  errors_count: number;

  @Column({ type: 'integer' })
  score: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  achieved_at: Date;
}
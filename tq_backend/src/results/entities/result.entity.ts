import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity'; 
import { Level } from 'src/levels/entities/level.entity'; 

@Entity('results')
export class Result {
  @PrimaryGeneratedColumn()
  result_id: number;

  @ManyToOne(() => User, (user) => user.results)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Level, (level) => level.results)
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  cpm: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  accuracy: number;

  @Column({ type: 'numeric', precision: 8, scale: 3 })
  completion_time: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  score: number;

  @Column('integer')
  errors_count: number;

  @Column({ type: 'timestamp', default: () => 'now()' })
  achieved_at: Date;
}
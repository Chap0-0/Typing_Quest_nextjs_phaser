import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Achievement } from './achievement.entity';

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn()
  achievement_id: number;

  @ManyToOne(() => User, (user) => user.achievements)
  user: User;

  @ManyToOne(() => Achievement, (achievement) => achievement.userAchievements)
  achievement: Achievement;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  unlocked_at: Date;
}
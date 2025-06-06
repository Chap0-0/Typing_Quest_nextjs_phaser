import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserAchievement } from './user-achievement.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  achievement_id: number;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', name: 'condition_text' })
  conditionText: string; 

  @Column({ length: 50, name: 'condition_type' })
  conditionType: string; 

  @Column({ type: 'integer', name: 'condition_value' })
  conditionValue: number;

  @Column({ length: 255, name: 'icon_path', nullable: true })
  iconPath: string;

  @OneToMany(() => UserAchievement, (userAchievement) => userAchievement.achievement)
  userAchievements: UserAchievement[];
}
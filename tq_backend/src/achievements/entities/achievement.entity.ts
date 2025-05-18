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
  conditionText: string; // например "Reach 100 WPM"

  @Column({ length: 50, name: 'condition_type' })
  conditionType: string; // например: wpm, level_completed

  @Column({ type: 'integer', name: 'condition_value' })
  conditionValue: number; // например: 100 для WPM

  @Column({ length: 255, name: 'icon_path', nullable: true })
  iconPath: string;

  @OneToMany(() => UserAchievement, (userAchievement) => userAchievement.achievement)
  userAchievements: UserAchievement[];
}
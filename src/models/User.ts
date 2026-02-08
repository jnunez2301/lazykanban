import { Table, Column, Model, DataType, HasMany, BelongsToMany } from 'sequelize-typescript';
import { Project } from './Project';
import { GroupMember } from './GroupMember';
import { Task } from './Task';

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  email!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  password!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.ENUM('advanced', 'normal'),
    allowNull: false,
    defaultValue: 'normal',
    field: 'ui_mode',
  })
  uiMode!: 'advanced' | 'normal';

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    defaultValue: 'avatar-1.png',
  })
  avatar?: string;

  @HasMany(() => Project, 'owner_id')
  ownedProjects!: Project[];

  @HasMany(() => Task, 'owner_id')
  ownedTasks!: Task[];

  @HasMany(() => Task, 'assignee_id')
  assignedTasks!: Task[];
}

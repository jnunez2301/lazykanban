import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from './Project';
import { User } from './User';
import { Tag } from './Tag';

@Table({
  tableName: 'tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Task extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'project_id',
  })
  projectId!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium',
  })
  priority!: 'low' | 'medium' | 'high';

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'due_date',
  })
  dueDate?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'owner_id',
  })
  ownerId!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'assignee_id',
  })
  assigneeId?: number;

  @ForeignKey(() => Tag)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'tag_id',
  })
  tagId?: number;

  @BelongsTo(() => Project, 'project_id')
  project!: Project;

  @BelongsTo(() => User, 'owner_id')
  owner!: User;

  @BelongsTo(() => User, 'assignee_id')
  assignee?: User;

  @BelongsTo(() => Tag, 'tag_id')
  tag?: Tag;
}

import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './User';
import { Group } from './Group';
import { Tag } from './Tag';
import { Task } from './Task';

@Table({
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Project extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_pinned',
  })
  isPinned!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'pinned_at',
  })
  pinnedAt?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'owner_id',
  })
  ownerId!: number;

  @BelongsTo(() => User, 'owner_id')
  owner!: User;

  @HasMany(() => Group, 'project_id')
  groups!: Group[];

  @HasMany(() => Tag, 'project_id')
  tags!: Tag[];

  @HasMany(() => Task, 'project_id')
  tasks!: Task[];
}

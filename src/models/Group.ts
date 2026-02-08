import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Project } from './Project';
import { GroupMember } from './GroupMember';
import { Permission } from './Permission';

@Table({
  tableName: 'groups',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Group extends Model {
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

  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'project_id',
  })
  projectId!: number;

  @BelongsTo(() => Project, 'project_id')
  project!: Project;

  @HasMany(() => GroupMember, 'group_id')
  members!: GroupMember[];

  @HasMany(() => Permission, 'group_id')
  permissions!: Permission[];
}

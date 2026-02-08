import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Group } from './Group';
import { User } from './User';

@Table({
  tableName: 'group_members',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class GroupMember extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Group)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'group_id',
  })
  groupId!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  userId!: number;

  @Column({
    type: DataType.ENUM('owner', 'admin', 'member'),
    allowNull: false,
    defaultValue: 'member',
  })
  role!: 'owner' | 'admin' | 'member';

  @BelongsTo(() => Group, 'group_id')
  group!: Group;

  @BelongsTo(() => User, 'user_id')
  user!: User;
}

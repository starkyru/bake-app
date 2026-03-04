import { Entity, ManyToOne, JoinColumn, Unique, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Permission } from './permission.entity';

@Entity('user_permissions')
@Unique(['userId', 'permissionId'])
export class UserPermission extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'permission_id' })
  permissionId: string;

  @Column({ name: 'grant_type', default: 'grant' })
  grantType: 'grant' | 'deny';

  @ManyToOne(() => User, (user) => user.userPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Permission, (perm) => perm.userPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}

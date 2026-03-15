/**
 * @file src/modules/users/users.module.ts
 * @module users
 * @description Users module for managing user accounts
 * @author BharatERP
 * @created 2025-09-18
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { SharedModule } from '../../shared/shared.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { RbacModule } from '../rbac/rbac.module';
import { ProfileController } from './controllers/profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), SharedModule, RbacModule],
  controllers: [UsersController, AdminUsersController, ProfileController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}

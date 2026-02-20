/**
 * @file src/modules/rbac/rbac.module.ts
 * @module rbac
 * @description RBAC module with roles and permissions scaffolding
 * @author BharatERP
 * @created 2025-09-18
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RbacService } from './rbac.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import { RbacSeeder } from './rbac.seeder';
import { AdminRolesController } from './controllers/admin-roles.controller';
import { AdminPermissionsController } from './controllers/admin-permissions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity,
      PermissionEntity,
      UserRoleEntity,
      RolePermissionEntity,
    ]),
  ],
  controllers: [AdminRolesController, AdminPermissionsController],
  providers: [RbacService, PermissionsGuard, RolesGuard, TenantGuard, RbacSeeder],
  exports: [RbacService, PermissionsGuard, RolesGuard, TenantGuard],
})
export class RbacModule {}

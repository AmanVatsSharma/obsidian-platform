/**
 * File:        apps/backend/src/modules/rbac/controllers/admin-team.controller.ts
 * Module:      rbac
 * Purpose:     Admin REST endpoints for managing broker admin staff (team members).
 *              Separate from client user lifecycle — team members have roles, not KYC flows.
 *
 * Exports:
 *   - AdminTeamController — @Controller('admin/team-members')
 *       GET    /admin/team-members       — list team members for tenant (admin staff, not clients)
 *       POST   /admin/team-members       — create a team member
 *       PATCH  /admin/team-members/:id   — update role or status
 *       GET    /admin/rbac/users         — list all users (staff + clients) for tenant
 *       PATCH  /admin/rbac/users/:id     — update user role or status
 *       POST   /admin/rbac/users/invite  — invite a new team member
 *
 * Depends on:
 *   - UsersService       — findAll (admin team), create, update, findOneOrThrow
 *   - RbacService        — ensureRole (for team member role assignment)
 *
 * Side-effects: DB writes via UsersService
 *
 * Key invariants:
 *   - Team members are identified by tenantId on the UserEntity; client users and staff share the table
 *   - Role assignment uses ensureRole (upsert semantics)
 *
 * Read order:
 *   1. listTeamMembers() — paginated team listing via UsersService.findAll
 *   2. createTeamMember()  — creates UserEntity + assigns roles
 *   3. updateTeamMember()  — role replacement + status toggle
 *   4. listRbacUsers()    — full user listing (staff + clients) with role enrichment
 *   5. updateRbacUser()   — role patch + status toggle
 *   6. inviteRbacUser()   — invite flow (creates user + sends invite)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-16
 */

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminListTeamMembersQueryDto, CreateTeamMemberDto, UpdateTeamMemberDto } from '../dto/admin-team.dto';
import { UsersService } from '../../users/users.service';
import { RbacService } from '../rbac.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Tenant } from '../decorators/tenant.decorator';
import { AppLoggerService } from '../../../shared/logger';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListUsersDto } from '../../users/dto/list-users.dto';
import { AppError } from '../../../common/errors/app-error';
import { UserEntity } from '../../users/entities/user.entity';
import { RoleEntity } from '../entities/role.entity';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

class ListRbacUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

class UpdateRbacUserDto {
  @IsOptional()
  @IsString()
  status?: 'Active' | 'Inactive';

  @IsOptional()
  @IsUUID()
  roleId?: string;
}

class InviteRbacUserDto {
  @IsString()
  @MaxLength(64)
  mobileE164!: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsUUID()
  roleId!: string;
}

@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('admin')
@ApiTags('Admin Team')
@ApiBearerAuth('JWT')
@Controller('admin')
export class AdminTeamController {
  private readonly usersRepo: Repository<UserEntity>;
  private readonly rolesRepo: Repository<RoleEntity>;

  constructor(
    private readonly users: UsersService,
    private readonly rbac: RbacService,
    private readonly logger: AppLoggerService,
    @InjectRepository(UserEntity)
    userEntityRepo: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    roleEntityRepo: Repository<RoleEntity>,
  ) {
    this.logger.setContext(AdminTeamController.name);
    this.usersRepo = userEntityRepo;
    this.rolesRepo = roleEntityRepo;
  }

  // ─── /admin/team-members ─────────────────────────────────────────────────────

  @Get('team-members')
  @ApiOperation({ summary: 'List all team members for tenant' })
  @ApiResponse({ status: 200, description: 'Team members', schema: { example: { data: [], page: 1, limit: 20, total: 0 } } })
  async listTeamMembers(
    @Tenant() tenantId: string,
    @Query() query: AdminListTeamMembersQueryDto,
  ) {
    this.logger.debug('GET /admin/team-members', { tenantId, query });
    const dto: ListUsersDto = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      search: query.search,
    };
    return this.users.findAll(tenantId, dto);
  }

  @Post('team-members')
  @ApiOperation({ summary: 'Create a team member' })
  @ApiResponse({ status: 201, description: 'Team member created' })
  async createTeamMember(
    @Tenant() tenantId: string,
    @Body() dto: CreateTeamMemberDto,
  ) {
    this.logger.debug('POST /admin/team-members', { tenantId, email: dto.email });
    // Ensure tenantId from body matches JWT context
    const createDto = { ...dto, tenantId };
    const user = await this.users.create(createDto);
    // Assign roles
    for (const roleName of dto.roleNames) {
      await this.rbac.assignRoleToUser(tenantId, user.id, roleName);
    }
    return user;
  }

  @Patch('team-members/:id')
  @ApiOperation({ summary: 'Update team member role or status' })
  @ApiParam({ name: 'id', example: 'user-uuid' })
  @ApiResponse({ status: 200, description: 'Team member updated' })
  async updateTeamMember(
    @Tenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    this.logger.debug('PATCH /admin/team-members/:id', { tenantId, id, dto });
    if (dto.status) {
      if (dto.status === 'Inactive') {
        await this.users.deactivate(tenantId, id);
      } else {
        await this.users.reactivate(tenantId, id);
      }
    }
    if (dto.roleNames) {
      // Remove all existing roles and reassign
      await this.rbac.userHasAnyRole(tenantId, id, []); // ensure user exists
      for (const roleName of dto.roleNames) {
        await this.rbac.assignRoleToUser(tenantId, id, roleName);
      }
    }
    return this.users.findOneOrThrow(tenantId, id);
  }

  // ─── /admin/rbac/users ───────────────────────────────────────────────────────

  @Get('rbac/users')
  @ApiOperation({ summary: 'List all users (staff + clients) for tenant with role enrichment' })
  @ApiResponse({ status: 200, description: 'Users with roles' })
  async listRbacUsers(
    @Tenant() tenantId: string,
    @Query() query: ListRbacUsersQueryDto,
  ) {
    this.logger.debug('GET /admin/rbac/users', { tenantId, query });
    return this.users.findAll(tenantId, {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      search: query.search,
    });
  }

  @Patch('rbac/users/:id')
  @ApiOperation({ summary: 'Update user role or status (rbac admin)' })
  @ApiParam({ name: 'id', example: 'user-uuid' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async updateRbacUser(
    @Tenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRbacUserDto,
  ) {
    this.logger.debug('PATCH /admin/rbac/users/:id', { tenantId, id, dto });
    const user = await this.users.findOneOrThrow(tenantId, id);
    if (dto.status === 'Inactive') {
      await this.users.deactivate(tenantId, id);
    } else if (dto.status === 'Active') {
      await this.users.reactivate(tenantId, id);
    }
    if (dto.roleId) {
      // Remove existing roles and assign new one
      await this.usersRepo.manager.query(
        'DELETE FROM user_roles WHERE tenant_id = $1 AND user_id = $2',
        [tenantId, id],
      );
      await this.rbac.assignRoleToUser(tenantId, id, dto.roleId);
    }
    return this.users.findOneOrThrow(tenantId, id);
  }

  @Post('rbac/users/invite')
  @ApiOperation({ summary: 'Invite a new team member (creates user + sends invite)' })
  @ApiResponse({ status: 201, description: 'User created and invite sent' })
  async inviteRbacUser(
    @Tenant() tenantId: string,
    @Body() dto: InviteRbacUserDto,
  ) {
    this.logger.debug('POST /admin/rbac/users/invite', { tenantId, email: dto.email });
    const user = await this.users.create({ tenantId, mobileE164: dto.mobileE164, email: dto.email, password: undefined } as any);
    if (dto.roleId) {
      const role = await this.rolesRepo.findOne({ where: { id: dto.roleId, tenantId } });
      if (role) await this.rbac.assignRoleToUser(tenantId, user.id, role.name);
    }
    // TODO: emit OutboxEvent for invite email/SMS (integration point)
    this.logger.debug('POST /admin/rbac/users/invite:end', { userId: user.id });
    return user;
  }
}
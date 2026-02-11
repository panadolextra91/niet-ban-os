import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming this exists, verify with list_dir

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // Apply to all admin routes
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('dashboard')
    @Roles(SystemRole.TRU_TRI)
    @ApiOperation({ summary: 'Xem tổng quan công đức (Chỉ Trụ Trì)' })
    async getDashboard() {
        return this.adminService.getDashboardStats();
    }

    @Post('users/:id/ban')
    @Roles(SystemRole.TRU_TRI, SystemRole.SU_TRUONG)
    @ApiOperation({ summary: 'Trục xuất con nhang (Ban User)' })
    async banUser(@Param('id') userId: string) {
        return this.adminService.banUser(userId);
    }

    @Post('users/:id/unban')
    @Roles(SystemRole.TRU_TRI)
    @ApiOperation({ summary: 'Khoan hồng (Unban User)' })
    async unbanUser(@Param('id') userId: string) {
        return this.adminService.unbanUser(userId);
    }
}

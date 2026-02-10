import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
// Note: We need a JwtAuthGuard here as well, which I will create in AuthModule.

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('dashboard')
    @Roles(SystemRole.TRU_TRI)
    @UseGuards(RolesGuard) // In a real app, you'd use JwtAuthGuard too.
    @ApiOperation({ summary: 'Xem tổng quan công đức (Chỉ Trụ Trì)' })
    async getDashboard() {
        return this.adminService.getDashboardStats();
    }
}

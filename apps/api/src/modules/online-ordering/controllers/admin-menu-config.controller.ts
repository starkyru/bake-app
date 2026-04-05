import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { MenuConfigService } from '../services/menu-config.service';
import { UpdateMenuConfigDto, CreateMenuScheduleDto, UpdateMenuScheduleDto } from '../dto';

@ApiTags('Admin - Menu Config')
@Controller('api/v1/admin/menus')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminMenuConfigController {
  constructor(private menuConfigService: MenuConfigService) {}

  @Get(':id/config')
  @RequirePermissions('products:read')
  @ApiOperation({ summary: 'Get menu online config' })
  getConfig(@Param('id') id: string) {
    return this.menuConfigService.getConfig(id);
  }

  @Put(':id/config')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Update menu online config' })
  updateConfig(@Param('id') id: string, @Body() dto: UpdateMenuConfigDto) {
    return this.menuConfigService.updateConfig(id, dto);
  }

  @Get(':id/schedules')
  @RequirePermissions('products:read')
  @ApiOperation({ summary: 'Get menu schedules' })
  getSchedules(@Param('id') id: string) {
    return this.menuConfigService.getSchedules(id);
  }

  @Post(':id/schedules')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Create menu schedule' })
  createSchedule(@Param('id') id: string, @Body() dto: CreateMenuScheduleDto) {
    return this.menuConfigService.createSchedule(id, dto);
  }

  @Put(':id/schedules/:scheduleId')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Update menu schedule' })
  updateSchedule(@Param('scheduleId') scheduleId: string, @Body() dto: UpdateMenuScheduleDto) {
    return this.menuConfigService.updateSchedule(scheduleId, dto);
  }

  @Delete(':id/schedules/:scheduleId')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Delete menu schedule' })
  deleteSchedule(@Param('scheduleId') scheduleId: string) {
    return this.menuConfigService.deleteSchedule(scheduleId);
  }

  @Get(':id/tags')
  @RequirePermissions('products:read')
  @ApiOperation({ summary: 'Get tags for menu' })
  getTags(@Param('id') id: string) {
    return this.menuConfigService.getMenuTags(id);
  }

  @Put(':id/tags')
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Set tags for menu' })
  setTags(@Param('id') id: string, @Body() body: { tagIds: string[] }) {
    return this.menuConfigService.setMenuTags(id, body.tagIds);
  }
}

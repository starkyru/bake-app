import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import { CustomOrderRequestService } from '../services/custom-order-request.service';
import { CreateCustomOrderRequestDto } from '../dto';

@ApiTags('Storefront - Custom Orders')
@ApiBearerAuth()
@UseGuards(CustomerAuthGuard)
@Controller('api/v1/storefront/custom-orders')
export class CustomOrderRequestController {
  constructor(
    private readonly customOrderRequestService: CustomOrderRequestService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a custom order request' })
  async create(@Req() req: any, @Body() dto: CreateCustomOrderRequestDto) {
    return this.customOrderRequestService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my custom order requests' })
  async findByCustomer(@Req() req: any) {
    return this.customOrderRequestService.findByCustomer(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a custom order request by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const request = await this.customOrderRequestService.findOne(id);
    if (request.customerId !== req.user.id) {
      throw new BadRequestException('You can only view your own custom order requests');
    }
    return request;
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a quoted custom order' })
  async approve(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.customOrderRequestService.customerApprove(id, req.user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a quoted custom order' })
  async reject(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.customOrderRequestService.customerReject(id, req.user.id);
  }
}

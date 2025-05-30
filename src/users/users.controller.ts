import { Controller, Get, UseGuards, Req, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Patch('me')
  @ApiOperation({
    summary: 'Update user information (username and/or password)',
  })
  @ApiResponse({
    status: 200,
    description: 'User information updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(req.user.userId, updateUserDto);
  }

  @Get('login-records')
  @ApiOperation({ summary: 'Get user login history (up to 30 records)' })
  @ApiResponse({
    status: 200,
    description: 'Login records retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLoginRecords(@Req() req) {
    return this.usersService.getLoginRecords(req.user.userId);
  }

  @Get('login-rankings')
  @ApiOperation({ summary: 'Get weekly login rankings' })
  @ApiResponse({
    status: 200,
    description: 'Login rankings retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLoginRankings() {
    return this.usersService.getLoginRankings();
  }
}

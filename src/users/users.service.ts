import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prepare update data
    const updateData: any = {};

    // Process password if provided
    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      updateData.password = hashedPassword;
    }

    // Process username if provided
    if (updateUserDto.username) {
      updateData.username = updateUserDto.username;
    }

    // Update user if there are fields to update
    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    return {
      success: true,
      message: 'User information updated successfully',
    };
  }

  async getLoginRecords(userId: string) {
    const loginRecords = await this.prisma.loginRecord.findMany({
      where: {
        userId,
      },
      orderBy: {
        loginTime: 'desc',
      },
      take: 30,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    const formattedRecords = loginRecords.map(record => ({
      id: record.id,
      username: record.user?.username || null,
      loginTime: format(record.loginTime, 'yyyy-MM-dd HH:mm:ss'),
      ipAddress: record.ipAddress,
    }));

    return {
      success: true,
      data: formattedRecords,
      message: 'Login records retrieved successfully',
    };
  }

  async getLoginRankings() {
    // Get current week's start (Monday) and end (Sunday)
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // 1 = Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Get login counts for the current week
    const loginCounts = await this.prisma.$queryRaw`
      SELECT 
        u.username, 
        COUNT(lr.id) as loginCount
      FROM 
        "users" u
      JOIN 
        "login_records" lr ON u.id = lr."userId"
      WHERE 
        lr."loginTime" >= ${weekStart} AND lr."loginTime" <= ${weekEnd}
      GROUP BY 
        u.id, u.username
      ORDER BY 
        loginCount DESC
      LIMIT 20
    `;

    // If no login records for the current week
    if (!loginCounts || (loginCounts as any[]).length === 0) {
      return {
        success: true,
        data: {
          rankings: [],
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        },
        message: 'No login rankings for the current week',
      };
    }

    // Calculate rankings
    const rankings = [];
    let currentRank = 1;
    let currentCount = null;
    let sameRankCount = 0;

    for (const record of loginCounts as any[]) {
      if (currentCount !== record.logincount) {
        // New login count, so new rank
        currentRank = currentRank + sameRankCount;
        sameRankCount = 1;
        currentCount = record.logincount;
      } else {
        // Same login count, so same rank
        sameRankCount++;
      }

      rankings.push({
        username: record.username,
        loginCount: Number(record.logincount),
        rank: currentRank,
      });
    }

    // Count users with same rank
    const ranksWithSharedCount = rankings.map(ranking => {
      const sharedRankCount = rankings.filter(
        r => r.rank === ranking.rank,
      ).length;
      return {
        ...ranking,
        sharedRankCount,
      };
    });

    return {
      success: true,
      data: {
        rankings: ranksWithSharedCount,
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      },
      message: 'Login rankings retrieved successfully',
    };
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Apply extensions during initialization
    super();
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Database connection successful');
  }
}

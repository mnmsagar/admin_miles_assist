import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { buildDatabaseUrl } from '../config/build-database-url';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Build the connection URL from individual DB_* env vars at runtime,
    // so no DATABASE_URL needs to live in the environment.
    super({ datasources: { db: { url: buildDatabaseUrl() } } });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

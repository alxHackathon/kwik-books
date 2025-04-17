import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})

export class PrismaModule {}
// This module provides the PrismaService, which is used to interact with the database.
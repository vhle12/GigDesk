import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'
import { PrismaClient } from '../generated/prisma/client'

// ws needed for Node.js < 22 (dev and Vercel functions below Node 22)
neonConfig.webSocketConstructor = ws

// PrismaNeon takes a config object and creates the pool internally
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

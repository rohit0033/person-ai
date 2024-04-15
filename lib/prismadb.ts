import { PrismaClient } from "@prisma/client";

declare global {
    var prisma : PrismaClient | undefined;
}

const prisamdb = globalThis.prisma || new PrismaClient();


if(process.env.NODE_ENV !== 'production') globalThis.prisma = prisamdb;

export default prisamdb;
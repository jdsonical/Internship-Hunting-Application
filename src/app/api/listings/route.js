import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    const listings = await prisma.post.findMany()
    return NextResponse.json(listings)
}

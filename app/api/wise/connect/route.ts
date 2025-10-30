import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createWiseClient } from '@/lib/wise';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiToken } = await request.json();

    if (!apiToken) {
      return NextResponse.json({ error: 'API token is required' }, { status: 400 });
    }

    // Create Wise client and verify token
    const wiseClient = createWiseClient(apiToken);
    const isValid = await wiseClient.verify();

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid Wise API token' }, { status: 401 });
    }

    // Get profiles
    const profiles = await wiseClient.getProfiles();

    if (profiles.length === 0) {
      return NextResponse.json({ error: 'No Wise profiles found' }, { status: 404 });
    }

    // Use the first profile (personal profile)
    const profile = profiles.find((p: any) => p.type === 'PERSONAL') || profiles[0];

    // Create bank connection
    const bankConnection = await prisma.bankConnection.create({
      data: {
        userId: session.user.id,
        provider: 'wise',
        institutionName: 'Wise',
        accessToken: apiToken, // TODO: Encrypt this in production
        isActive: true,
      },
    });

    // Get borderless accounts
    const borderlessAccounts = await wiseClient.getAccounts(profile.id);

    const createdAccounts = [];

    // Create an account for each currency balance
    for (const borderlessAccount of borderlessAccounts) {
      for (const balance of borderlessAccount.balances) {
        const account = await prisma.account.create({
          data: {
            userId: session.user.id,
            name: `Wise ${balance.currency}`,
            type: 'checking',
            balance: balance.amount.value,
            currency: balance.currency,
            bankConnectionId: bankConnection.id,
            wiseProfileId: profile.id.toString(),
            isActive: true,
          },
        });
        createdAccounts.push(account);
      }
    }

    return NextResponse.json({
      success: true,
      bankConnection,
      accounts: createdAccounts,
      profile: {
        id: profile.id,
        name: profile.fullName,
        type: profile.type,
      },
    });
  } catch (error: any) {
    console.error('Error connecting Wise account:', error);
    return NextResponse.json(
      { error: 'Failed to connect Wise account', details: error.message },
      { status: 500 }
    );
  }
}

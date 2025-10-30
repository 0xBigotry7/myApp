import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { plaidClient } from '@/lib/plaid';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { public_token, metadata } = await request.json();

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get institution info
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });

    const institutionId = itemResponse.data.item.institution_id;
    let institutionName = metadata.institution?.name || 'Unknown Bank';

    if (institutionId) {
      try {
        const instResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ['US'] as any,
        });
        institutionName = instResponse.data.institution.name;
      } catch (error) {
        console.error('Error fetching institution name:', error);
      }
    }

    // Create bank connection
    const bankConnection = await prisma.bankConnection.create({
      data: {
        userId: session.user.id,
        provider: 'plaid',
        institutionName,
        institutionId: institutionId || null,
        accessToken, // TODO: Encrypt this in production
        itemId,
        isActive: true,
      },
    });

    // Get accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Create accounts in our database
    const accounts = await Promise.all(
      accountsResponse.data.accounts.map(async (plaidAccount) => {
        return prisma.account.create({
          data: {
            userId: session.user.id,
            name: plaidAccount.name,
            type: plaidAccount.type.toLowerCase(),
            balance: plaidAccount.balances.current || 0,
            currency: plaidAccount.balances.iso_currency_code || 'USD',
            bankConnectionId: bankConnection.id,
            plaidAccountId: plaidAccount.account_id,
            isActive: true,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      bankConnection,
      accounts,
    });
  } catch (error: any) {
    console.error('Error exchanging token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token', details: error.message },
      { status: 500 }
    );
  }
}

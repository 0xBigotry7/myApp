import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { plaidClient } from '@/lib/plaid';
import { CountryCode, Products } from 'plaid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await request.json();

    const configs = {
      user: {
        client_user_id: session.user.id,
      },
      client_name: 'MyApp Finance Tracker',
      products: [Products.Transactions] as Products[],
      country_codes: [CountryCode.Us] as CountryCode[],
      language: 'en',
    };

    // If we have an access token, we're updating an existing connection
    if (accessToken) {
      const response = await plaidClient.linkTokenCreate({
        ...configs,
        access_token: accessToken,
      });
      return NextResponse.json({ link_token: response.data.link_token });
    }

    // Otherwise, creating a new connection
    const response = await plaidClient.linkTokenCreate(configs);
    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error);
    return NextResponse.json(
      { error: 'Failed to create link token', details: error.message },
      { status: 500 }
    );
  }
}

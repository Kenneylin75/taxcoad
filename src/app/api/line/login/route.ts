import { NextRequest, NextResponse } from 'next/server';
import { getLineConfig } from '@/app/actions';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const templeId = url.searchParams.get('templeId');
  if (!templeId) {
    return NextResponse.json({ error: 'Missing templeId' }, { status: 400 });
  }

  const config = await getLineConfig(templeId);
  if (!config || !config.lineLoginClientId) {
    return NextResponse.json({ error: 'LINE Login is not configured for this temple' }, { status: 400 });
  }

  const state = Math.random().toString(36).substring(7);
  const redirectUri = `${url.origin}/api/line/callback?templeId=${templeId}`;

  const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  lineAuthUrl.searchParams.append('response_type', 'code');
  lineAuthUrl.searchParams.append('client_id', config.lineLoginClientId);
  lineAuthUrl.searchParams.append('redirect_uri', redirectUri);
  lineAuthUrl.searchParams.append('state', state);
  lineAuthUrl.searchParams.append('scope', 'profile openid');

  return NextResponse.redirect(lineAuthUrl.toString());
}

import { NextRequest, NextResponse } from 'next/server';
import { getLineConfig } from '@/app/actions';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const templeId = url.searchParams.get('templeId');

  if (!templeId) {
    return NextResponse.json({ error: 'Missing templeId' }, { status: 400 });
  }

  if (error || !code) {
    return NextResponse.redirect(`${url.origin}/${templeId}/login?error=LineLoginFailed`);
  }

  const config = await getLineConfig(templeId);
  if (!config || !config.lineLoginClientId || !config.lineChannelSecret) {
    return NextResponse.json({ error: 'LINE Login is not fully configured for this temple' }, { status: 400 });
  }

  const redirectUri = `${url.origin}/api/line/callback?templeId=${templeId}`;

  try {
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', redirectUri);
    tokenParams.append('client_id', config.lineLoginClientId);
    tokenParams.append('client_secret', config.lineChannelSecret);

    const tokenResp = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });
    
    if (!tokenResp.ok) {
       console.error('[LINE Token Error]', await tokenResp.text());
       return NextResponse.redirect(`${url.origin}/${templeId}/login?error=LineTokenError`);
    }

    const tokenData = await tokenResp.json();
    
    // Use id_token to extract the user's sub (LINE ID)
    const profileResp = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token: tokenData.id_token, client_id: config.lineLoginClientId }).toString()
    });

    if (!profileResp.ok) {
       console.error('[LINE Profile Error]', await profileResp.text());
       return NextResponse.redirect(`${url.origin}/${templeId}/login?error=LineProfileError`);
    }

    const profileData = await profileResp.json();
    const lineUserId = profileData.sub;
    const name = profileData.name || '';
    const picture = profileData.picture || '';

    // Redirect user to the frontend bind page
    const bindUrl = new URL(`${url.origin}/${templeId}/line-bind`);
    bindUrl.searchParams.append('lineUserId', lineUserId);
    bindUrl.searchParams.append('name', name);
    bindUrl.searchParams.append('picture', picture);
    
    return NextResponse.redirect(bindUrl.toString());

  } catch (err: any) {
    console.error('[LINE Callback Exception]', err);
    return NextResponse.redirect(`${url.origin}/${templeId}/login?error=InternalError`);
  }
}

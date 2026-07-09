import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getLineConfig } from '@/app/actions';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const templeId = url.searchParams.get('templeId');
    if (!templeId) return NextResponse.json({ error: 'Missing templeId' }, { status: 400 });

    const config = await getLineConfig(templeId);
    if (!config || !config.lineChannelSecret) {
       return NextResponse.json({ error: 'LINE integration not configured' }, { status: 400 });
    }

    const bodyText = await req.text();
    const signature = req.headers.get('x-line-signature');

    // Verify signature
    const hash = crypto.createHmac('sha256', config.lineChannelSecret).update(bodyText).digest('base64');
    if (hash !== signature) {
      console.warn(`[LINE Webhook] Signature verification failed for temple: ${templeId}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(bodyText);
    const events = body.events || [];

    for (const event of events) {
       if (event.type === 'message' && event.message.type === 'text') {
          // Simple reply to acknowledge
          const replyToken = event.replyToken;
          if (config.lineChannelToken) {
             await fetch('https://api.line.me/v2/bot/message/reply', {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${config.lineChannelToken}`
               },
               body: JSON.stringify({
                 replyToken: replyToken,
                 messages: [ { type: 'text', text: '收到您的訊息！若要綁定帳號，請點選下方選單進行登入。' } ]
               })
             });
          }
       }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[LINE Webhook Error]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

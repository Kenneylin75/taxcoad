import { NextResponse } from 'next/server';
import { confirmPaymentSuccess } from '@/app/actions';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, method } = body;

    if (!orderId || status !== 'Paid') {
      return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    const result = await confirmPaymentSuccess(orderId.toString(), method || 'Unknown');

    if (result) {
      return NextResponse.json({ success: true, message: 'Payment status updated' });
    } else {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

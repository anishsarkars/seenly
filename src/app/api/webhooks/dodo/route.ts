import { NextResponse } from 'next/server';
import { getDodoClient } from '@/lib/billing/dodo-client';
import { handleDodoWebhookEvent, hasProcessedWebhook, markWebhookProcessed } from '@/lib/billing/webhook-handler';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;

  let event: { type?: string; data?: unknown; webhook_id?: string; id?: string };

  try {
    const client = getDodoClient();

    if (webhookKey) {
      const headers = Object.fromEntries(request.headers.entries());
      event = client.webhooks.unwrap(rawBody, { headers, key: webhookKey }) as unknown as typeof event;
    } else {
      console.warn('DODO_PAYMENTS_WEBHOOK_KEY not set — skipping signature verification.');
      event = client.webhooks.unsafeUnwrap(rawBody) as unknown as typeof event;
    }
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  const eventId =
    (typeof event.webhook_id === 'string' && event.webhook_id) ||
    (typeof event.id === 'string' && event.id) ||
    `${event.type}-${JSON.stringify(event.data ?? {}).slice(0, 120)}`;

  try {
    if (!(await hasProcessedWebhook(eventId))) {
      await handleDodoWebhookEvent(event);
      await markWebhookProcessed(eventId, event.type || 'unknown');
    }
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Processing failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

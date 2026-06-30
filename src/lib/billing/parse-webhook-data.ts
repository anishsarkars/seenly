/** Extract common fields from Dodo webhook `data` payloads (shape varies by event). */
export function parseDodoEventData(data: Record<string, unknown>) {
  const metadata =
    data.metadata && typeof data.metadata === 'object'
      ? (data.metadata as Record<string, unknown>)
      : null;

  const customerField = data.customer;
  const customerObj =
    customerField && typeof customerField === 'object'
      ? (customerField as Record<string, unknown>)
      : null;

  const customerId =
    typeof data.customer_id === 'string'
      ? data.customer_id
      : typeof customerObj?.customer_id === 'string'
        ? customerObj.customer_id
        : null;

  const subscriptionField = data.subscription;
  const subscriptionObj =
    subscriptionField && typeof subscriptionField === 'object'
      ? (subscriptionField as Record<string, unknown>)
      : null;

  const subscriptionId =
    typeof data.subscription_id === 'string'
      ? data.subscription_id
      : typeof subscriptionObj?.subscription_id === 'string'
        ? subscriptionObj.subscription_id
        : null;

  const productField = data.product;
  const productObj =
    productField && typeof productField === 'object'
      ? (productField as Record<string, unknown>)
      : null;

  const productId =
    typeof data.product_id === 'string'
      ? data.product_id
      : typeof productObj?.product_id === 'string'
        ? productObj.product_id
        : null;

  const cartProductIds = Array.isArray(data.product_cart)
    ? data.product_cart
        .map((item) =>
          item && typeof item === 'object' ? (item as { product_id?: string }).product_id : null
        )
        .filter((id): id is string => typeof id === 'string')
    : [];

  const metadataPlan =
    typeof metadata?.seenly_plan === 'string' ? metadata.seenly_plan : null;

  const metadataUserId =
    typeof metadata?.seenly_user_id === 'string' ? metadata.seenly_user_id : null;

  const paymentId =
    typeof data.payment_id === 'string'
      ? data.payment_id
      : typeof data.id === 'string' && (data.payload_type === 'Payment' || String(data.id).startsWith('pay_'))
        ? data.id
        : null;

  const nextBilling =
    typeof data.next_billing_date === 'string'
      ? data.next_billing_date
      : typeof data.current_period_end === 'string'
        ? data.current_period_end
        : null;

  return {
    metadata,
    customerId,
    subscriptionId,
    productId,
    cartProductIds,
    metadataPlan,
    metadataUserId,
    paymentId,
    nextBilling,
  };
}

export function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

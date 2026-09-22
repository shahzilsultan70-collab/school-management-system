import api from './api';

export type PaymentType = 'one_time' | 'subscription';

export type PaymentStatus =
  'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused';

export interface PaymentFee {
  _id: string;

  feeType: string;

  academicSession: string;

  month: string | null;

  totalAmount: number;

  paidAmount: number;

  remainingAmount: number;

  status: string;

  dueDate: string;
}

export interface PaymentStudent {
  _id: string;

  firstName: string;

  lastName: string;

  email: string;
}

export interface Payment {
  _id: string;

  studentId: string | PaymentStudent;

  feeId: string | PaymentFee;

  amount: number;

  currency: string;

  paymentType: PaymentType;

  status: PaymentStatus;

  stripeCustomerId?: string | null;

  stripeCheckoutSessionId?: string | null;

  stripePaymentIntentId?: string | null;

  stripeSubscriptionId?: string | null;

  stripeInvoiceId?: string | null;

  stripeRefundId?: string | null;

  refundAmount?: number | null;

  paidAt?: string | null;

  refundedAt?: string | null;

  failureReason?: string | null;

  failureCode?: string | null;

  failureMessage?: string | null;

  receiptNumber?: string | null;

  feeApplied?: boolean;

  createdAt: string;

  updatedAt: string;
}

export interface Subscription {
  _id: string;

  studentId: string | PaymentStudent;

  feeId: string | PaymentFee;

  stripeSubscriptionId: string;

  stripeCheckoutSessionId?: string | null;

  stripeCustomerId?: string | null;

  amount: number;

  currency: string;

  status: SubscriptionStatus;

  cancelAtPeriodEnd: boolean;

  currentPeriodEnd?: string | null;

  canceledAt?: string | null;

  createdAt: string;

  updatedAt: string;
}

export interface PayableFee {
  _id: string;

  studentId: string;

  feeType: string;

  academicSession: string;

  month: string | null;

  totalAmount: number;

  paidAmount: number;

  remainingAmount: number;

  status: string;

  dueDate: string;

  paymentDate?: string | null;

  paymentMethod?: string | null;

  notes?: string | null;
}

export interface PaymentReceipt {
  receiptNumber: string;

  paymentId: string;

  paymentStatus: string;

  paymentType: string;

  amount: number;

  currency: string;

  paidAt: string | null;

  createdAt: string;

  student: {
    id: string;

    name: string;

    email: string;
  };

  fee: {
    id: string;

    feeType: string;

    academicSession: string;

    month: string | null;

    totalAmount: number;
  };
}

/*
|--------------------------------------------------------------------------
| STUDENT PAYMENT APIs
|--------------------------------------------------------------------------
*/

export const getMyPayments = async (): Promise<Payment[]> => {
  const response = await api.get('/payments/my');

  return response.data;
};

export const getPayment = async (paymentId: string): Promise<Payment> => {
  const response = await api.get(`/payments/${paymentId}`);

  return response.data;
};

export const getPaymentReceipt = async (
  paymentId: string,
): Promise<PaymentReceipt> => {
  const response = await api.get(`/payments/${paymentId}/receipt`);

  return response.data;
};

export const getMyPayableFees = async (): Promise<PayableFee[]> => {
  const response = await api.get('/payments/my/fees');

  return response.data;
};

/*
|--------------------------------------------------------------------------
| ONE-TIME PAYMENT
|--------------------------------------------------------------------------
*/

export const createCheckout = async (feeId: string) => {
  const response = await api.post('/payments/checkout', {
    feeId,
  });

  return response.data;
};

/*
|--------------------------------------------------------------------------
| SUBSCRIPTIONS
|--------------------------------------------------------------------------
*/

/**
 * Creates a Stripe Checkout session for a recurring
 * monthly subscription.
 */
export const createSubscription = async (feeId: string) => {
  const response = await api.post('/payments/subscription', {
    feeId,
  });

  return response.data;
};

export const getMySubscriptions = async (): Promise<Subscription[]> => {
  const response = await api.get('/payments/subscriptions/my');

  return response.data;
};

export const cancelSubscription = async (subscriptionId: string) => {
  const response = await api.post(
    `/payments/subscriptions/${subscriptionId}/cancel`,
  );

  return response.data;
};

/**
 * Removes cancel_at_period_end from the Stripe
 * subscription so it continues renewing.
 */
export const resumeSubscription = async (subscriptionId: string) => {
  const response = await api.post(
    `/payments/subscriptions/${subscriptionId}/resume`,
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| ADMIN PAYMENT APIs
|--------------------------------------------------------------------------
*/

export const getAdminPayments = async (): Promise<Payment[]> => {
  const response = await api.get('/payments/admin/all');

  return response.data;
};

export const getAdminPaymentDashboard = async () => {
  const response = await api.get('/payments/admin/dashboard');

  return response.data;
};

export const getAdminSubscriptions = async (): Promise<Subscription[]> => {
  const response = await api.get('/payments/admin/subscriptions');

  return response.data;
};

/*
|--------------------------------------------------------------------------
| REFUND
|--------------------------------------------------------------------------
*/

export const refundPayment = async (paymentId: string) => {
  const response = await api.post(`/payments/${paymentId}/refund`);

  return response.data;
};

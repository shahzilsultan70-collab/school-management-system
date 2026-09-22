export interface FeeSummary {
  _id: string;
  feeType: string;
  academicSession: string;
  month?: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  dueDate: string;
  paymentDate?: string | null;
  paymentMethod?: string | null;
}

export interface StudentSummary {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Payment {
  _id: string;

  studentId: string | StudentSummary;

  feeId: string | FeeSummary;

  amount: number;

  currency: string;

  paymentType: 'one_time' | 'subscription';

  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

  stripeCustomerId?: string | null;

  stripeCheckoutSessionId?: string | null;

  stripePaymentIntentId?: string | null;

  stripeSubscriptionId?: string | null;

  stripeInvoiceId?: string | null;

  stripeRefundId?: string | null;

  refundAmount?: number | null;

  refundedAt?: string | null;

  receiptNumber?: string | null;

  paidAt?: string | null;

  failureReason?: string | null;

  failureCode?: string | null;

  failureMessage?: string | null;

  createdAt: string;

  updatedAt: string;
}

export interface Subscription {
  _id: string;

  studentId: string | StudentSummary;

  feeId: string | FeeSummary;

  stripeSubscriptionId: string | null;

  stripeCheckoutSessionId: string | null;

  stripeCustomerId: string | null;

  amount: number;

  currency: string;

  status:
    | 'pending'
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'cancelled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'unpaid'
    | 'paused';

  cancelAtPeriodEnd: boolean;

  currentPeriodEnd: string | null;

  canceledAt: string | null;

  createdAt: string;

  updatedAt: string;
}

export interface PaymentDashboard {
  totalRevenue: number;
  totalPaid: number;
  totalRefunded: number;
  netRevenue: number;
  paidPayments: number;
  refundedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  activeSubscriptions: number;
}

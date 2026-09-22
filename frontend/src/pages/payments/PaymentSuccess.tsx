import { CheckCircle2 } from 'lucide-react';

export default function PaymentSuccess() {
  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="rounded-xl border border-green-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />

        <h1 className="mt-5 text-2xl font-bold text-gray-900">
          Payment Successful
        </h1>

        <p className="mt-2 text-gray-500">
          Your payment was completed successfully. Your payment history will be
          updated shortly after Stripe confirms the payment.
        </p>

        <a
          href="/payments"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to Payments
        </a>
      </div>
    </div>
  );
}

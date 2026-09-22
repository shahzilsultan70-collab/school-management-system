import { XCircle } from 'lucide-react';

export default function PaymentCancel() {
  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />

        <h1 className="mt-5 text-2xl font-bold text-gray-900">
          Payment Cancelled
        </h1>

        <p className="mt-2 text-gray-500">
          The payment process was cancelled. No successful payment was recorded.
        </p>

        <a
          href="/payments"
          className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Return to Payments
        </a>
      </div>
    </div>
  );
}

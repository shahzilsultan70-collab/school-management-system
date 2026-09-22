import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { InjectModel } from '@nestjs/mongoose';

import Stripe from 'stripe';

import { Model, Types } from 'mongoose';

import {
  Fee,
  FeeDocument,
  PaymentMethod,
  PaymentStatus as FeePaymentStatus,
} from '../fees/schemas/fee.schema';

import { User, UserDocument } from '../users/schemas/user.schema';

import {
  Payment,
  PaymentDocument,
  PaymentStatus,
  PaymentType,
} from './schemas/payment.schema';

import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from './schemas/subscription.schema';

import {
  StripeEvent,
  StripeEventDocument,
} from './schemas/stripe-event.schema';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,

    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel(Fee.name)
    private readonly feeModel: Model<FeeDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,

    @InjectModel(StripeEvent.name)
    private readonly stripeEventModel: Model<StripeEventDocument>,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey);
  }

  // =========================================================
  // CUSTOMER
  // =========================================================

  private async getOrCreateStripeCustomer(userId: string): Promise<string> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const existingPayment = await this.paymentModel.findOne({
      studentId: new Types.ObjectId(userId),
      stripeCustomerId: {
        $ne: null,
      },
    });

    if (existingPayment?.stripeCustomerId) {
      return existingPayment.stripeCustomerId;
    }

    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('Student account not found');
    }

    const customerName = `${user.firstName} ${user.lastName}`.trim();

    const customer = await this.stripe.customers.create({
      name: customerName || undefined,
      email: user.email,
      metadata: {
        userId,
      },
    });

    return customer.id;
  }

  // =========================================================
  // ONE-TIME CHECKOUT
  // =========================================================

  async createCheckoutSession(feeId: string, userId: string) {
    this.validateObjectIds(feeId, userId);

    const fee = await this.feeModel.findById(feeId);

    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    if (fee.studentId.toString() !== userId) {
      throw new UnauthorizedException('You are not authorized to pay this fee');
    }

    if (fee.remainingAmount <= 0) {
      throw new BadRequestException('This fee has already been fully paid');
    }

    /*
     * Reuse an existing pending Checkout Session.
     */
    const existingPayment = await this.paymentModel.findOne({
      studentId: new Types.ObjectId(userId),
      feeId: new Types.ObjectId(feeId),
      paymentType: PaymentType.ONE_TIME,
      status: PaymentStatus.PENDING,
      stripeCheckoutSessionId: {
        $ne: null,
      },
    });

    if (existingPayment?.stripeCheckoutSessionId) {
      try {
        const existingSession = await this.stripe.checkout.sessions.retrieve(
          existingPayment.stripeCheckoutSessionId,
        );

        if (existingSession.status === 'open' && existingSession.url) {
          return {
            message: 'Existing Stripe Checkout session found',
            checkoutUrl: existingSession.url,
            sessionId: existingSession.id,
          };
        }
      } catch (error) {
        console.warn(
          'Existing Stripe Checkout session could not be retrieved:',
          error instanceof Error ? error.message : error,
        );
      }
    }

    const customerId = await this.getOrCreateStripeCustomer(userId);

    const amountInCents = Math.round(fee.remainingAmount * 100);

    if (amountInCents <= 0) {
      throw new BadRequestException('Invalid remaining fee amount');
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    const session = await this.stripe.checkout.sessions.create(
      {
        mode: 'payment',

        customer: customerId,

        payment_method_types: ['card'],

        line_items: [
          {
            price_data: {
              currency: 'usd',

              product_data: {
                name: `${fee.feeType} Fee`,

                description: fee.month
                  ? `${fee.month} - ${fee.academicSession}`
                  : `Academic Session ${fee.academicSession}`,
              },

              unit_amount: amountInCents,
            },

            quantity: 1,
          },
        ],

        metadata: {
          feeId: fee._id.toString(),
          studentId: userId,
          paymentType: PaymentType.ONE_TIME,
        },

        success_url: `${frontendUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url: `${frontendUrl}/payments/cancel`,

        billing_address_collection: 'auto',
      },
      {
        idempotencyKey: `checkout-${userId}-${feeId}-${amountInCents}`,
      },
    );

    await this.paymentModel.create({
      studentId: new Types.ObjectId(userId),

      feeId: fee._id,

      amount: fee.remainingAmount,

      currency: 'usd',

      paymentType: PaymentType.ONE_TIME,

      status: PaymentStatus.PENDING,

      stripeCustomerId: customerId,

      stripeCheckoutSessionId: session.id,

      feeApplied: true,
    });

    return {
      message: 'Stripe Checkout session created',

      checkoutUrl: session.url,

      sessionId: session.id,
    };
  }

  // =========================================================
  // SUBSCRIPTION CHECKOUT
  // =========================================================

  async createSubscriptionCheckout(feeId: string, userId: string) {
    this.validateObjectIds(feeId, userId);

    const fee = await this.feeModel.findById(feeId);

    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    if (fee.studentId.toString() !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to subscribe to this fee',
      );
    }

    if (fee.remainingAmount <= 0) {
      throw new BadRequestException('This fee has already been fully paid');
    }

    /*
     * Check whether this student already has
     * an active/pending subscription for this fee.
     */
    const existingSubscription = await this.subscriptionModel.findOne({
      studentId: new Types.ObjectId(userId),

      feeId: new Types.ObjectId(feeId),

      status: {
        $in: [
          SubscriptionStatus.PENDING,
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIALING,
          SubscriptionStatus.PAST_DUE,
        ],
      },
    });

    if (existingSubscription) {
      /*
       * If a pending subscription has an existing
       * Stripe Checkout session, reuse it.
       */
      if (
        existingSubscription.status === SubscriptionStatus.PENDING &&
        existingSubscription.stripeCheckoutSessionId
      ) {
        try {
          const existingSession = await this.stripe.checkout.sessions.retrieve(
            existingSubscription.stripeCheckoutSessionId,
          );

          if (existingSession.status === 'open' && existingSession.url) {
            return {
              message: 'Existing subscription checkout session found',

              checkoutUrl: existingSession.url,

              sessionId: existingSession.id,
            };
          }
        } catch (error) {
          console.warn(
            'Existing subscription checkout could not be retrieved:',
            error instanceof Error ? error.message : error,
          );
        }
      }

      throw new BadRequestException(
        'A subscription already exists for this fee',
      );
    }

    const customerId = await this.getOrCreateStripeCustomer(userId);

    const amountInCents = Math.round(fee.remainingAmount * 100);

    if (amountInCents <= 0) {
      throw new BadRequestException('Invalid subscription amount');
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    /*
     * Create a unique checkout attempt ID.
     *
     * This is important because a previously cancelled
     * subscription must be able to create a new Stripe
     * Checkout Session.
     */
    const checkoutAttemptId = new Types.ObjectId().toString();

    const session = await this.stripe.checkout.sessions.create(
      {
        mode: 'subscription',

        customer: customerId,

        payment_method_types: ['card'],

        line_items: [
          {
            price_data: {
              currency: 'usd',

              product_data: {
                name: `${fee.feeType} Monthly Subscription`,

                description: fee.month
                  ? `${fee.month} - ${fee.academicSession}`
                  : 'Monthly School Fee',
              },

              unit_amount: amountInCents,

              recurring: {
                interval: 'month',
              },
            },

            quantity: 1,
          },
        ],

        metadata: {
          feeId: fee._id.toString(),

          studentId: userId,

          paymentType: PaymentType.SUBSCRIPTION,

          checkoutAttemptId,
        },

        subscription_data: {
          metadata: {
            feeId: fee._id.toString(),

            studentId: userId,

            checkoutAttemptId,
          },
        },

        success_url: `${frontendUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url: `${frontendUrl}/payments/cancel`,

        billing_address_collection: 'auto',
      },
      {
        idempotencyKey: `subscription-${checkoutAttemptId}`,
      },
    );

    await this.subscriptionModel.create({
      studentId: new Types.ObjectId(userId),

      feeId: new Types.ObjectId(feeId),

      stripeCheckoutSessionId: session.id,

      stripeCustomerId: customerId,

      amount: fee.remainingAmount,

      currency: 'usd',

      status: SubscriptionStatus.PENDING,
    });

    await this.paymentModel.create({
      studentId: new Types.ObjectId(userId),

      feeId: new Types.ObjectId(feeId),

      amount: fee.remainingAmount,

      currency: 'usd',

      paymentType: PaymentType.SUBSCRIPTION,

      status: PaymentStatus.PENDING,

      stripeCustomerId: customerId,

      stripeCheckoutSessionId: session.id,

      feeApplied: true,
    });

    return {
      message: 'Stripe subscription checkout created',

      checkoutUrl: session.url,

      sessionId: session.id,
    };
  }

  // =========================================================
  // STUDENT FEES
  // =========================================================

  async getMyPayableFees(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.feeModel
      .find({
        studentId: new Types.ObjectId(userId),

        remainingAmount: {
          $gt: 0,
        },
      })
      .sort({
        dueDate: 1,
      })
      .exec();
  }

  // =========================================================
  // PAYMENT HISTORY
  // =========================================================

  async getMyPayments(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.paymentModel
      .find({
        studentId: new Types.ObjectId(userId),
      })
      .populate({
        path: 'feeId',
        select:
          'feeType academicSession month totalAmount paidAmount remainingAmount status dueDate paymentDate paymentMethod',
      })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // PAYMENT DETAILS
  // =========================================================

  async getPaymentById(paymentId: string, userId: string, isAdmin = false) {
    if (!Types.ObjectId.isValid(paymentId)) {
      throw new BadRequestException('Invalid payment ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const query: any = {
      _id: new Types.ObjectId(paymentId),
    };

    if (!isAdmin) {
      query.studentId = new Types.ObjectId(userId);
    }

    const payment = await this.paymentModel
      .findOne(query)
      .populate({
        path: 'feeId',
        select:
          'feeType academicSession month totalAmount paidAmount remainingAmount status dueDate paymentDate paymentMethod',
      })
      .populate({
        path: 'studentId',
        select: 'firstName lastName email',
      })
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // =========================================================
  // RECEIPT
  // =========================================================

  async getReceipt(paymentId: string, userId: string, isAdmin = false) {
    const payment = await this.getPaymentById(paymentId, userId, isAdmin);

    if (
      payment.status !== PaymentStatus.PAID &&
      payment.status !== PaymentStatus.REFUNDED
    ) {
      throw new BadRequestException(
        'Receipt is available only for completed payments',
      );
    }

    if (!payment.receiptNumber) {
      payment.receiptNumber = this.generateReceiptNumber();

      await payment.save();
    }

    return {
      receiptNumber: payment.receiptNumber,

      paymentId: payment._id,

      status: payment.status,

      amount: payment.amount,

      currency: payment.currency,

      paymentType: payment.paymentType,

      paidAt: payment.paidAt,

      refundedAt: payment.refundedAt,

      refundAmount: payment.refundAmount,

      student: payment.studentId,

      fee: payment.feeId,

      createdAt: this.getDocumentCreatedAt(payment),
    };
  }

  // =========================================================
  // MY SUBSCRIPTIONS
  // =========================================================

  async getMySubscriptions(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.subscriptionModel
      .find({
        studentId: new Types.ObjectId(userId),
      })
      .populate({
        path: 'feeId',
        select:
          'feeType academicSession month totalAmount paidAmount remainingAmount status dueDate',
      })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // MY ACTIVE SUBSCRIPTION
  // =========================================================

  async getMySubscription(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.subscriptionModel
      .findOne({
        studentId: new Types.ObjectId(userId),

        status: {
          $nin: [
            SubscriptionStatus.CANCELLED,
            SubscriptionStatus.INCOMPLETE_EXPIRED,
          ],
        },
      })
      .populate({
        path: 'feeId',
        select:
          'feeType academicSession month totalAmount paidAmount remainingAmount status dueDate',
      })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // CANCEL SUBSCRIPTION
  // =========================================================

  async cancelSubscription(subscriptionId: string, userId: string) {
    if (!Types.ObjectId.isValid(subscriptionId)) {
      throw new BadRequestException('Invalid subscription ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const subscription = await this.subscriptionModel.findOne({
      _id: new Types.ObjectId(subscriptionId),

      studentId: new Types.ObjectId(userId),
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Stripe subscription is not active yet');
    }

    if (subscription.cancelAtPeriodEnd) {
      return {
        message: 'Subscription cancellation is already scheduled',

        subscriptionId: subscription._id,

        cancelAtPeriodEnd: true,

        currentPeriodEnd: subscription.currentPeriodEnd,
      };
    }

    const updated = await this.stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    subscription.cancelAtPeriodEnd = updated.cancel_at_period_end;

    subscription.currentPeriodEnd =
      this.getStripeSubscriptionPeriodEnd(updated);

    await subscription.save();

    return {
      message:
        'Subscription cancellation scheduled for the end of the current billing period',

      subscriptionId: subscription._id,

      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,

      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  // =========================================================
  // RESUME SUBSCRIPTION
  // =========================================================

  async resumeSubscription(subscriptionId: string, userId: string) {
    if (!Types.ObjectId.isValid(subscriptionId)) {
      throw new BadRequestException('Invalid subscription ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const subscription = await this.subscriptionModel.findOne({
      _id: new Types.ObjectId(subscriptionId),

      studentId: new Types.ObjectId(userId),
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Stripe subscription is not active yet');
    }

    if (!subscription.cancelAtPeriodEnd) {
      return {
        message: 'Subscription is already active',

        subscriptionId: subscription._id,

        cancelAtPeriodEnd: false,

        currentPeriodEnd: subscription.currentPeriodEnd,
      };
    }

    if (
      subscription.status === SubscriptionStatus.CANCELLED ||
      subscription.status === SubscriptionStatus.INCOMPLETE_EXPIRED
    ) {
      throw new BadRequestException(
        'This subscription can no longer be resumed',
      );
    }

    const updated = await this.stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      },
    );

    subscription.cancelAtPeriodEnd = updated.cancel_at_period_end;

    subscription.currentPeriodEnd =
      this.getStripeSubscriptionPeriodEnd(updated);

    subscription.status = this.mapSubscriptionStatus(updated.status);

    await subscription.save();

    return {
      message: 'Subscription resumed successfully',

      subscriptionId: subscription._id,

      status: subscription.status,

      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,

      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  // =========================================================
  // ADMIN DASHBOARD
  // =========================================================

  async getAdminDashboard() {
    const [paid, refunded, pending, failed, activeSubscriptions] =
      await Promise.all([
        this.paymentModel.aggregate([
          {
            $match: {
              status: PaymentStatus.PAID,
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum: '$amount',
              },

              count: {
                $sum: 1,
              },
            },
          },
        ]),

        this.paymentModel.aggregate([
          {
            $match: {
              status: PaymentStatus.REFUNDED,
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum: {
                  $ifNull: ['$refundAmount', 0],
                },
              },

              count: {
                $sum: 1,
              },
            },
          },
        ]),

        this.paymentModel.countDocuments({
          status: PaymentStatus.PENDING,
        }),

        this.paymentModel.countDocuments({
          status: PaymentStatus.FAILED,
        }),

        this.subscriptionModel.countDocuments({
          status: {
            $in: [
              SubscriptionStatus.ACTIVE,
              SubscriptionStatus.TRIALING,
              SubscriptionStatus.PAST_DUE,
            ],
          },
        }),
      ]);

    const totalPaid = paid[0]?.total || 0;

    const totalRefunded = refunded[0]?.total || 0;

    return {
      totalRevenue: totalPaid,

      totalPaid,

      totalRefunded,

      netRevenue: totalPaid - totalRefunded,

      paidPayments: paid[0]?.count || 0,

      refundedPayments: refunded[0]?.count || 0,

      pendingPayments: pending,

      failedPayments: failed,

      activeSubscriptions,
    };
  }

  // =========================================================
  // ADMIN PAYMENT LIST
  // =========================================================

  async getAdminPayments() {
    return this.paymentModel
      .find()
      .populate({
        path: 'studentId',
        select: 'firstName lastName email',
      })
      .populate({
        path: 'feeId',
        select:
          'feeType academicSession month totalAmount paidAmount remainingAmount status dueDate',
      })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // ADMIN SUBSCRIPTIONS
  // =========================================================

  async getAdminSubscriptions() {
    return this.subscriptionModel
      .find()
      .populate({
        path: 'studentId',
        select: 'firstName lastName email',
      })
      .populate({
        path: 'feeId',
        select:
          'feeType academicSession month totalAmount paidAmount remainingAmount status',
      })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // REFUND
  // =========================================================

  async refundPayment(paymentId: string) {
    if (!Types.ObjectId.isValid(paymentId)) {
      throw new BadRequestException('Invalid payment ID');
    }

    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Payment has already been refunded');
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid payments can be refunded');
    }

    if (!payment.stripePaymentIntentId) {
      throw new BadRequestException('Stripe PaymentIntent not found');
    }

    const refund = await this.stripe.refunds.create(
      {
        payment_intent: payment.stripePaymentIntentId,
      },
      {
        idempotencyKey: `refund-${payment._id.toString()}`,
      },
    );

    payment.status = PaymentStatus.REFUNDED;

    payment.stripeRefundId = refund.id;

    payment.refundAmount = (refund.amount || 0) / 100;

    payment.refundedAt = new Date();

    await payment.save();

    if (payment.feeApplied !== false) {
      await this.reversePaymentFromFee(payment, payment.refundAmount || 0);
    }

    return {
      message: 'Payment refunded successfully',

      paymentId: payment._id,

      refundId: refund.id,

      refundAmount: payment.refundAmount,

      status: payment.status,
    };
  }

  // =========================================================
  // STRIPE WEBHOOK
  // =========================================================

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      console.error(
        'Stripe webhook signature verification failed:',
        error instanceof Error ? error.message : error,
      );

      throw new UnauthorizedException('Invalid Stripe webhook signature');
    }

    const existingEvent = await this.stripeEventModel.findOne({
      eventId: event.id,
    });

    if (existingEvent) {
      return {
        received: true,
        duplicate: true,
      };
    }

    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    try {
      await this.stripeEventModel.create({
        eventId: event.id,
        type: event.type,
      });
    } catch (error: any) {
      if (error?.code !== 11000) {
        throw error;
      }
    }

    return {
      received: true,
    };
  }

  // =========================================================
  // CHECKOUT COMPLETED
  // =========================================================

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const payment = await this.paymentModel.findOne({
      stripeCheckoutSessionId: session.id,
    });

    if (!payment) {
      console.error(`Payment not found for checkout session ${session.id}`);

      return;
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null;

    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : null;

    const invoiceId =
      typeof session.invoice === 'string' ? session.invoice : null;

    if (paymentIntentId) {
      payment.stripePaymentIntentId = paymentIntentId;
    }

    if (subscriptionId) {
      payment.stripeSubscriptionId = subscriptionId;
    }

    if (invoiceId) {
      payment.stripeInvoiceId = invoiceId;
    }

    if (session.payment_status !== 'paid') {
      await payment.save();

      return;
    }

    if (payment.status !== PaymentStatus.PAID) {
      payment.status = PaymentStatus.PAID;

      payment.paidAt = new Date();

      if (!payment.receiptNumber) {
        payment.receiptNumber = this.generateReceiptNumber();
      }

      await payment.save();

      if (payment.feeApplied !== false) {
        await this.applyPaymentToFee(payment);
      }
    } else {
      await payment.save();
    }

    if (subscriptionId) {
      await this.syncSubscriptionFromStripe(
        subscriptionId,

        payment.studentId.toString(),

        payment.feeId.toString(),

        session.id,

        payment.stripeCustomerId,
      );
    }
  }

  // =========================================================
  // INVOICE PAID
  // =========================================================

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const invoiceAny = invoice as any;

    const subscriptionId =
      typeof invoiceAny.subscription === 'string'
        ? invoiceAny.subscription
        : invoiceAny.subscription?.id;

    if (!subscriptionId) {
      return;
    }

    const subscription = await this.subscriptionModel.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (!subscription) {
      console.warn(`Local subscription not found: ${subscriptionId}`);

      return;
    }

    const amount = (invoiceAny.amount_paid || 0) / 100;

    let payment = await this.paymentModel.findOne({
      stripeInvoiceId: invoice.id,
    });

    /*
     * Only reuse a pending subscription payment.
     *
     * Renewal invoices should create a new payment
     * record for every monthly payment.
     */
    if (!payment) {
      payment = await this.paymentModel
        .findOne({
          stripeSubscriptionId: subscriptionId,

          status: PaymentStatus.PENDING,
        })
        .sort({
          createdAt: -1,
        });
    }

    if (!payment) {
      payment = await this.paymentModel.create({
        studentId: subscription.studentId,

        feeId: subscription.feeId,

        amount,

        currency: invoice.currency || 'usd',

        paymentType: PaymentType.SUBSCRIPTION,

        status: PaymentStatus.PAID,

        stripeCustomerId: subscription.stripeCustomerId,

        stripeSubscriptionId: subscriptionId,

        stripeInvoiceId: invoice.id,

        paidAt: new Date(),

        receiptNumber: this.generateReceiptNumber(),

        /*
         * Monthly renewal payments do not
         * modify the original fee amount.
         */
        feeApplied: false,
      });
    } else {
      payment.stripeInvoiceId = invoice.id;

      payment.stripeSubscriptionId = subscriptionId;

      if (
        !payment.stripePaymentIntentId &&
        typeof invoiceAny.payment_intent === 'string'
      ) {
        payment.stripePaymentIntentId = invoiceAny.payment_intent;
      }

      payment.amount = amount || payment.amount;

      payment.status = PaymentStatus.PAID;

      payment.paidAt = new Date();

      if (!payment.receiptNumber) {
        payment.receiptNumber = this.generateReceiptNumber();
      }

      await payment.save();

      if (payment.feeApplied !== false) {
        await this.applyPaymentToFee(payment);
      }
    }

    subscription.status = SubscriptionStatus.ACTIVE;

    subscription.cancelAtPeriodEnd = false;

    await subscription.save();
  }

  // =========================================================
  // INVOICE PAYMENT FAILED
  // =========================================================

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const invoiceAny = invoice as any;

    const subscriptionId =
      typeof invoiceAny.subscription === 'string'
        ? invoiceAny.subscription
        : invoiceAny.subscription?.id;

    if (!subscriptionId) {
      return;
    }

    const subscription = await this.subscriptionModel.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (!subscription) {
      return;
    }

    let payment = await this.paymentModel.findOne({
      stripeInvoiceId: invoice.id,
    });

    const failureMessage =
      invoiceAny.last_payment_error?.message ||
      invoiceAny.last_finalization_error?.message ||
      'Subscription payment failed';

    const failureCode =
      invoiceAny.last_payment_error?.code ||
      invoiceAny.last_finalization_error?.code ||
      null;

    if (!payment) {
      payment = await this.paymentModel.create({
        studentId: subscription.studentId,

        feeId: subscription.feeId,

        amount: (invoiceAny.amount_due || 0) / 100,

        currency: invoice.currency || 'usd',

        paymentType: PaymentType.SUBSCRIPTION,

        status: PaymentStatus.FAILED,

        stripeCustomerId: subscription.stripeCustomerId,

        stripeSubscriptionId: subscriptionId,

        stripeInvoiceId: invoice.id,

        failureCode,

        failureReason: failureMessage,

        failureMessage,

        feeApplied: false,
      });
    } else {
      payment.status = PaymentStatus.FAILED;

      payment.failureCode = failureCode;

      payment.failureReason = failureMessage;

      payment.failureMessage = failureMessage;

      await payment.save();
    }

    subscription.status = SubscriptionStatus.PAST_DUE;

    await subscription.save();
  }

  // =========================================================
  // PAYMENT INTENT FAILED
  // =========================================================

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentModel.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!payment) {
      return;
    }

    const lastError = paymentIntent.last_payment_error;

    payment.status = PaymentStatus.FAILED;

    payment.failureCode = lastError?.code || null;

    payment.failureReason = lastError?.message || 'Payment failed';

    payment.failureMessage = lastError?.message || 'Payment failed';

    await payment.save();
  }

  // =========================================================
  // SUBSCRIPTION UPDATED
  // =========================================================

  private async handleSubscriptionUpdated(
    stripeSubscription: Stripe.Subscription,
  ) {
    const subscription = await this.subscriptionModel.findOne({
      stripeSubscriptionId: stripeSubscription.id,
    });

    if (!subscription) {
      return;
    }

    subscription.status = this.mapSubscriptionStatus(stripeSubscription.status);

    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

    subscription.currentPeriodEnd =
      this.getStripeSubscriptionPeriodEnd(stripeSubscription);

    await subscription.save();
  }

  // =========================================================
  // SUBSCRIPTION DELETED
  // =========================================================

  private async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ) {
    const subscription = await this.subscriptionModel.findOne({
      stripeSubscriptionId: stripeSubscription.id,
    });

    if (!subscription) {
      return;
    }

    subscription.status = SubscriptionStatus.CANCELLED;

    subscription.cancelAtPeriodEnd = false;

    subscription.canceledAt = new Date();

    subscription.currentPeriodEnd =
      this.getStripeSubscriptionPeriodEnd(stripeSubscription);

    await subscription.save();
  }

  // =========================================================
  // CHARGE REFUNDED
  // =========================================================

  private async handleChargeRefunded(charge: Stripe.Charge) {
    const chargeAny = charge as any;

    const paymentIntentId =
      typeof chargeAny.payment_intent === 'string'
        ? chargeAny.payment_intent
        : chargeAny.payment_intent?.id;

    if (!paymentIntentId) {
      return;
    }

    const payment = await this.paymentModel.findOne({
      stripePaymentIntentId: paymentIntentId,
    });

    if (!payment) {
      return;
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      return;
    }

    const refund = chargeAny.refunds?.data?.[0];

    payment.status = PaymentStatus.REFUNDED;

    payment.refundAmount = refund?.amount
      ? refund.amount / 100
      : payment.amount;

    payment.stripeRefundId = refund?.id || null;

    payment.refundedAt = new Date();

    await payment.save();

    if (payment.feeApplied !== false) {
      await this.reversePaymentFromFee(payment, payment.refundAmount || 0);
    }
  }

  // =========================================================
  // APPLY PAYMENT TO FEE
  // =========================================================

  private async applyPaymentToFee(payment: PaymentDocument) {
    const fee = await this.feeModel.findById(payment.feeId);

    if (!fee) {
      console.error(`Fee ${payment.feeId} not found`);

      return;
    }

    /*
     * Do not apply the same payment twice.
     *
     * If the fee is already paid, do nothing.
     */
    if (fee.remainingAmount <= 0 && fee.status === FeePaymentStatus.PAID) {
      return;
    }

    const newPaidAmount = fee.paidAmount + payment.amount;

    const newRemainingAmount = Math.max(fee.totalAmount - newPaidAmount, 0);

    fee.paidAmount = Math.min(newPaidAmount, fee.totalAmount);

    fee.remainingAmount = newRemainingAmount;

    if (newRemainingAmount === 0) {
      fee.status = FeePaymentStatus.PAID;
    } else if (fee.paidAmount > 0) {
      fee.status = FeePaymentStatus.PARTIAL;
    } else {
      fee.status = FeePaymentStatus.PENDING;
    }

    fee.paymentDate = new Date();

    fee.paymentMethod = PaymentMethod.ONLINE;

    await fee.save();
  }

  // =========================================================
  // REVERSE PAYMENT FROM FEE
  // =========================================================

  private async reversePaymentFromFee(
    payment: PaymentDocument,
    refundAmount: number,
  ) {
    const fee = await this.feeModel.findById(payment.feeId);

    if (!fee) {
      console.error(`Fee ${payment.feeId} not found while processing refund`);

      return;
    }

    fee.paidAmount = Math.max(fee.paidAmount - refundAmount, 0);

    fee.remainingAmount = Math.max(fee.totalAmount - fee.paidAmount, 0);

    if (fee.paidAmount <= 0) {
      fee.status = FeePaymentStatus.PENDING;
    } else if (fee.remainingAmount > 0) {
      fee.status = FeePaymentStatus.PARTIAL;
    } else {
      fee.status = FeePaymentStatus.PAID;
    }

    if (fee.remainingAmount > 0) {
      fee.paymentDate = null;

      fee.paymentMethod = null;
    }

    await fee.save();
  }

  // =========================================================
  // SYNC SUBSCRIPTION
  // =========================================================

  private async syncSubscriptionFromStripe(
    stripeSubscriptionId: string,
    studentId: string,
    feeId: string,
    checkoutSessionId: string,
    customerId: string | null,
  ) {
    const stripeSubscription =
      await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

    let subscription = await this.subscriptionModel.findOne({
      stripeSubscriptionId,
    });

    if (!subscription) {
      subscription = await this.subscriptionModel.findOne({
        stripeCheckoutSessionId: checkoutSessionId,
      });
    }

    if (!subscription) {
      subscription = await this.subscriptionModel.create({
        studentId: new Types.ObjectId(studentId),

        feeId: new Types.ObjectId(feeId),

        stripeSubscriptionId,

        stripeCheckoutSessionId: checkoutSessionId,

        stripeCustomerId: customerId,

        amount: 0,

        currency: 'usd',

        status: this.mapSubscriptionStatus(stripeSubscription.status),

        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,

        currentPeriodEnd:
          this.getStripeSubscriptionPeriodEnd(stripeSubscription),
      });
    } else {
      subscription.stripeSubscriptionId = stripeSubscriptionId;

      subscription.stripeCheckoutSessionId = checkoutSessionId;

      subscription.stripeCustomerId = customerId;

      subscription.status = this.mapSubscriptionStatus(
        stripeSubscription.status,
      );

      subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

      subscription.currentPeriodEnd =
        this.getStripeSubscriptionPeriodEnd(stripeSubscription);

      /*
       * The subscription was successfully
       * created in Stripe.
       */
      if (subscription.amount <= 0) {
        subscription.amount = this.getStripeSubscriptionAmount(
          stripeSubscription,
          subscription.amount,
        );
      }

      await subscription.save();
    }
  }

  // =========================================================
  // GET STRIPE SUBSCRIPTION AMOUNT
  // =========================================================

  private getStripeSubscriptionAmount(
    subscription: Stripe.Subscription,
    fallback: number,
  ): number {
    const stripeSubscription = subscription as any;

    const amount = stripeSubscription.items?.data?.[0]?.price?.unit_amount;

    if (typeof amount !== 'number' || amount < 0) {
      return fallback;
    }

    return amount / 100;
  }

  // =========================================================
  // STATUS MAPPING
  // =========================================================

  private mapSubscriptionStatus(
    status: Stripe.Subscription.Status,
  ): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.ACTIVE;

      case 'trialing':
        return SubscriptionStatus.TRIALING;

      case 'past_due':
        return SubscriptionStatus.PAST_DUE;

      case 'canceled':
        return SubscriptionStatus.CANCELLED;

      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;

      case 'incomplete_expired':
        return SubscriptionStatus.INCOMPLETE_EXPIRED;

      case 'unpaid':
        return SubscriptionStatus.UNPAID;

      case 'paused':
        return SubscriptionStatus.PAUSED;

      default:
        return SubscriptionStatus.PENDING;
    }
  }

  // =========================================================
  // STRIPE PERIOD END HELPER
  // =========================================================

  private getStripeSubscriptionPeriodEnd(
    subscription: Stripe.Subscription,
  ): Date | null {
    const stripeSubscription = subscription as Stripe.Subscription & {
      current_period_end?: number;
    };

    if (
      typeof stripeSubscription.current_period_end !== 'number' ||
      stripeSubscription.current_period_end <= 0
    ) {
      return null;
    }

    return new Date(stripeSubscription.current_period_end * 1000);
  }

  // =========================================================
  // DOCUMENT CREATED AT HELPER
  // =========================================================

  private getDocumentCreatedAt(document: PaymentDocument): Date | null {
    const value = (
      document as PaymentDocument & {
        createdAt?: Date;
      }
    ).createdAt;

    return value || null;
  }

  // =========================================================
  // VALIDATE OBJECT IDS
  // =========================================================

  private validateObjectIds(feeId: string, userId: string) {
    if (!Types.ObjectId.isValid(feeId)) {
      throw new BadRequestException('Invalid fee ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
  }

  // =========================================================
  // RECEIPT NUMBER
  // =========================================================

  private generateReceiptNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const random = new Types.ObjectId().toString().slice(-6).toUpperCase();

    return `RCPT-${date}-${random}`;
  }
}

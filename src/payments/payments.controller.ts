import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '../users/schemas/user.schema';

interface AuthenticatedRequest extends Request {
  user: {
    sub?: string;
    id?: string;
    userId?: string;
    email?: string;
    role?: UserRole;
  };
}

interface StripeWebhookRequest extends Request {
  rawBody?: Buffer;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // =========================================================
  // STUDENT PAYMENT ROUTES
  // =========================================================

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyPayments(@Req() req: AuthenticatedRequest) {
    return this.paymentsService.getMyPayments(this.getUserId(req));
  }

  @Get('my/fees')
  @UseGuards(JwtAuthGuard)
  async getMyPayableFees(@Req() req: AuthenticatedRequest) {
    return this.paymentsService.getMyPayableFees(this.getUserId(req));
  }

  // =========================================================
  // SUBSCRIPTIONS
  // =========================================================

  @Get('subscriptions/my')
  @UseGuards(JwtAuthGuard)
  async getMySubscriptions(@Req() req: AuthenticatedRequest) {
    return this.paymentsService.getMySubscriptions(this.getUserId(req));
  }

  @Post('subscription')
  @UseGuards(JwtAuthGuard)
  async createSubscription(
    @Body() body: { feeId: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.createSubscriptionCheckout(
      body.feeId,
      this.getUserId(req),
    );
  }

  @Post('subscriptions/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @Param('id') subscriptionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.cancelSubscription(
      subscriptionId,
      this.getUserId(req),
    );
  }

  @Post('subscriptions/:id/resume')
  @UseGuards(JwtAuthGuard)
  async resumeSubscription(
    @Param('id') subscriptionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.resumeSubscription(
      subscriptionId,
      this.getUserId(req),
    );
  }

  // =========================================================
  // ONE-TIME CHECKOUT
  // =========================================================

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @Body() body: { feeId: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.createCheckoutSession(
      body.feeId,
      this.getUserId(req),
    );
  }

  // =========================================================
  // ADMIN PAYMENT ROUTES
  // =========================================================

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminDashboard() {
    return this.paymentsService.getAdminDashboard();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminPayments() {
    return this.paymentsService.getAdminPayments();
  }

  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminSubscriptions() {
    return this.paymentsService.getAdminSubscriptions();
  }

  // =========================================================
  // REFUND
  // =========================================================

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async refundPayment(@Param('id') paymentId: string) {
    return this.paymentsService.refundPayment(paymentId);
  }

  // =========================================================
  // PAYMENT DETAILS
  // =========================================================

  @Get(':id/receipt')
  @UseGuards(JwtAuthGuard)
  async getReceipt(
    @Param('id') paymentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.getReceipt(paymentId, this.getUserId(req));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPaymentById(
    @Param('id') paymentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.getPaymentById(paymentId, this.getUserId(req));
  }

  // =========================================================
  // STRIPE WEBHOOK
  // =========================================================
  //
  // IMPORTANT:
  // Stripe signature verification requires the ORIGINAL
  // raw request body, not the parsed JSON body.
  //
  // main.ts has:
  // rawBody: true
  //
  // Therefore we use req.rawBody here.
  // =========================================================

  @Post('webhook')
  async handleWebhook(
    @Req() req: StripeWebhookRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new Error('Stripe webhook raw body is missing');
    }

    if (!signature) {
      throw new Error('Stripe webhook signature is missing');
    }

    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }

  // =========================================================
  // HELPER
  // =========================================================

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new Error('Authenticated user ID is missing');
    }

    return userId;
  }
}

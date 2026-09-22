import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

import { Payment, PaymentSchema } from './schemas/payment.schema';

import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';

import { StripeEvent, StripeEventSchema } from './schemas/stripe-event.schema';

import { Fee, FeeSchema } from '../fees/schemas/fee.schema';

import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: Subscription.name,
        schema: SubscriptionSchema,
      },
      {
        name: StripeEvent.name,
        schema: StripeEventSchema,
      },
      {
        name: Fee.name,
        schema: FeeSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  controllers: [PaymentsController],

  providers: [PaymentsService],

  exports: [PaymentsService],
})
export class PaymentsModule {}

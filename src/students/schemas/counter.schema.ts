import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class Counter {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  key: string;

  @Prop({
    required: true,
    default: 0,
  })
  sequence: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);

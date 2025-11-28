import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  planId: string;

  @IsString()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;
}

export class CancelSubscriptionDto {
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;
}

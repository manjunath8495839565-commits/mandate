export type PaymentOperationKind =
  | 'CREATE_ORDER'
  | 'CAPTURE_ORDER'
  | 'REFUND_CAPTURE'
  | 'WEBHOOK_VERIFY';

export type PaymentOperationStatus =
  | 'PENDING'
  | 'CREATED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'FAILED'
  | 'IDEMPOTENT_REPLAY';

export interface PaymentOperationRecord {
  id: string;
  idempotency_key: string;
  kind: PaymentOperationKind;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  paypal_refund_id: string | null;
  request_json: string | null;
  response_json: string | null;
  status: PaymentOperationStatus;
  created_at: string;
  updated_at: string;
}

export interface PayPalLink {
  href: string;
  rel: string;
  method: string;
}

export interface PayPalOrderResponse {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  links: PayPalLink[];
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: {
      currency_code: string;
      value: string;
    };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
}

export interface PayPalCaptureResponse {
  id: string;
  status: 'COMPLETED' | 'DECLINED' | 'FAILED' | 'PENDING';
  amount: {
    currency_code: string;
    value: string;
  };
  final_capture?: boolean;
  seller_protection?: Record<string, any>;
  links?: PayPalLink[];
}

export interface PayPalWebhookVerificationRequest {
  transmission_id: string;
  transmission_time: string;
  cert_url: string;
  auth_algo: string;
  transmission_sig: string;
  webhook_id: string;
  webhook_event: Record<string, any>;
}

export interface PayPalWebhookVerificationResponse {
  verification_status: 'SUCCESS' | 'FAILURE';
}

export class PayPalError extends Error {
  public readonly statusCode: number;
  public readonly responseBody: any;

  constructor(message: string, statusCode: number, responseBody: any) {
    super(message);
    this.name = 'PayPalError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

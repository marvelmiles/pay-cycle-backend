import axios from "axios";
import logger from "../utils/logger";
import Customer, { ICustomerDoc } from "../models/profiles/customer";
import Transaction from "../models/billing/transaction";
import { IProductDoc } from "../models/product";
import Business from "../models/business";
import { getErrorDetails } from "../utils/api";

interface CardPaymentData {
  amount: string;
  customerId: string;
  currency: string;
  transactionRef: string;
  authData: string;
  paymentType: IProductDoc["type"];
  businessId: string;
  customer: ICustomerDoc;
  productId: string;
}

type TOKEN_CREDENTIAL_TYPE = "custom" | "interswitch";

class InterswitchService {
  private accessToken: string | null = null;

  private tokenExpiry: Date | null = null;

  private isTokenExpired(): boolean {
    return !this.tokenExpiry || Date.now() >= this.tokenExpiry.getTime();
  }

  private async getAccessToken(
    credentialType: TOKEN_CREDENTIAL_TYPE = "custom",
  ): Promise<string> {
    if (this.accessToken && !this.isTokenExpired()) {
      return this.accessToken;
    }

    try {
      const credentials =
        credentialType === "interswitch"
          ? process.env.INTERSWITCH_PROVIDER_ENCODED_VALUE
          : process.env.INTERSWITCH_MERCHANT_ENCODED_VALUE;

      const response = await axios.post(
        `https://passport-v2.k8.isw.la/passport/oauth/token?grant_type=client_credentials`,
        {},
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(
        Date.now() + (response.data.expires_in - 60) * 1000,
      );
      return this.accessToken!;
    } catch (error: any) {
      logger.error(`Interswitch auth error: ${getErrorDetails(error)}`);
      throw new Error("Failed to authenticate with Interswitch");
    }
  }

  normalizeResponseCode(code: string) {
    switch (code) {
      case "T0":
        return "VERIFY_OTP";
      case "00":
        return "SUCCESS";
      default:
        return "OK";
    }
  }

  async createHeaders(config?: { tokenType: TOKEN_CREDENTIAL_TYPE }) {
    return {
      Authorization: `Bearer ${await this.getAccessToken(config?.tokenType)}`,
      "Content-Type": "application/json",
    };
  }

  async syncCustomer(businessId: string, customer: ICustomerDoc) {
    const existing = await Customer.findOne({
      business: businessId,
      email: customer.email,
    });

    if (existing) return existing;

    return await Customer.create({
      ...customer,
      business: businessId,
    });
  }

  async updateRefDb(trxRef: string, businessId: string) {
    const transaction = await Transaction.findOne({
      reference: trxRef,
      business: businessId,
    });

    if (!transaction || transaction.status !== "pending") return;

    transaction.status = "successful";

    await transaction.save();

    await Customer.findByIdAndUpdate(transaction.customer, {
      $inc: { totalSpent: transaction.amount },
    });

    const business = await Business.findById(businessId);

    if (business) {
      await business.updateOne({
        availableBalance: (business.availableBalance || 0) + transaction.amount,
      });
    }
  }

  async initiateCardPayment(payload: CardPaymentData): Promise<{
    transactionRef: string;
    paymentId: string;
    message: string;
    amount: string;
    responseCode: string;
    supportMessage: string;
    withOtp: boolean;
    transactionId: string;
  }> {
    let trxId;

    try {
      const customer = await this.syncCustomer(
        payload.businessId,
        payload.customer,
      );

      const trx = await Transaction.create({
        business: payload.businessId,
        customer: customer._id,
        product: payload.productId,
        amount: payload.amount,
        currency: payload.currency,
        status: "pending",
        type: payload.paymentType,
        reference: payload.transactionRef,
      });

      trxId = trx._id;

      const handleResponse = async (response: any) => {
        const code =
          this.normalizeResponseCode(response.data.responseCode) || "";

        const withOtp = code === "VERIFY_OTP";

        const trxRef = response.data.transactionRef || "";

        return {
          transactionId: trx._id.toString(),
          transactionRef: trxRef,
          paymentId: response.data.paymentId || "",
          message: response.data.message || "",
          amount: response.data.amount || "",
          responseCode: code,
          supportMessage:
            response.data.plainTextSupportMessage ||
            response.data.supportMessage ||
            "",
          withOtp,
        };
      };

      if (payload.paymentType === "recurring") {
        const tr = await axios.post(
          "https://qa.interswitchng.com/api/v3/purchases/validations/recurrents",
          {
            transactionRef: payload.transactionRef,
            authData: payload.authData,
          },
          {
            headers: await this.createHeaders({
              tokenType: "interswitch",
            }),
          },
        );

        const token = tr.data.token;

        const tokenExpiryDate = tr.data.tokenExpiryDate;

        const pr = await axios.post(
          "https://qa.interswitchng.com/api/v3/purchases/recurrents",
          {
            customerId: payload.customerId,
            amount: payload.amount,
            currency: payload.currency,
            token,
            tokenExpiryDate,
            transactionRef: payload.transactionRef,
          },
          {
            headers: await this.createHeaders(),
          },
        );

        return await handleResponse(pr);
      }

      const response = await axios.post(
        `https://qa.interswitchng.com/api/v3/purchases`,
        payload,
        {
          headers: await this.createHeaders(),
        },
      );
      return await handleResponse(response);
    } catch (error: any) {
      if (trxId) {
        await Transaction.updateOne(
          {
            _id: trxId,
          },
          {
            status: "failed",
          },
        );
      }

      logger.error(`Interswitch initiate payment error: ${error}`);

      throw error;
    }
  }

  async verifyPaymentOtp(payload: {
    paymentId: string;
    otp: string;
    transactionId?: string;
  }): Promise<{
    transactionRef: string;
    message: string;
    token: string;
    tokenExpiryDate: string;
    panLast4Digits: string;
    amount: string;
    responseCode: string;
    cardType: string;
  }> {
    try {
      const response = await axios.post(
        "https://qa.interswitchng.com/api/v3/purchases/otps/auths",
        payload,
        {
          headers: await this.createHeaders(),
        },
      );

      return {
        transactionRef: response.data.transactionRef || "",
        message: response.data.message || "",
        token: response.data.message || "",
        tokenExpiryDate: response.data.tokenExpiryDate || "",
        panLast4Digits: response.data.panLast4Digits || "",
        amount: response.data.amount || "",
        responseCode:
          this.normalizeResponseCode(response.data.responseCode) || "",
        cardType: response.data.cardType || "",
      };
    } catch (error: any) {
      logger.error(
        `Interswitch verify payment otp error: ${getErrorDetails(error)}`,
      );

      throw error;
    }
  }

  async confirmPayment(payload: {
    trxRef: string;
    amount: string;
    businessId: string;
  }): Promise<{
    amount: number;
    cardNumber: string;
    merchantReference: string;
    paymentReference: string;
    retrievalReferenceNumber: string;
    transactionDate: string;
    responseCode: string;
    supportMessage: string;
    bankCode: string;
    paymentId: number;
  }> {
    try {
      const response = await axios.get(
        "https://qa.interswitchng.com/collections/api/v1/gettransaction",
        {
          params: {
            transactionreference: payload.trxRef,
            amount: Number(payload.amount) * 100,
            // for some reason using env response returns not found
            merchantcode: "MX275886", // process.env.INTERSWITCH_MERCHANT_CODE,
          },
          headers: await this.createHeaders(),
        },
      );

      await this.updateRefDb(payload.trxRef, payload.businessId);

      return {
        amount: response.data.Amount,
        cardNumber: response.data.CardNumber,
        merchantReference: response.data.MerchantReference,
        paymentReference: response.data.PaymentReference,
        retrievalReferenceNumber: response.data.RetrievalReferenceNumber,
        transactionDate: response.data.TransactionDate,
        responseCode: this.normalizeResponseCode(response.data.ResponseCode),
        supportMessage: response.data.ResponseDescription,
        bankCode: response.data.BankCode,
        paymentId: response.data.PaymentId,
      };
    } catch (error) {
      logger.error(`failed to confirm payment ${error}`);
      throw error;
    }
  }
}

export const interswitchService = new InterswitchService();

export default interswitchService;

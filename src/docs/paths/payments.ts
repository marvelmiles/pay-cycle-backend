import { OpenAPIV3 } from "openapi-types";
import { dataResponse } from "../components/responses";

export const paymentPaths: OpenAPIV3.PathsObject = {
  "/pay/card-payment": {
    post: {
      tags: ["Checkout"],
      summary: "Charge a card",
      description:
        "Step one of the hosted checkout. Creates a pending transaction, creates or reuses the customer record, then sends the encrypted card data to the gateway.\n\nBranch on responseCode: `VERIFY_OTP` means you must collect an OTP and call POST /pay/otp/verify, while `SUCCESS` means you can go straight to GET /pay/confirm-payment. If the gateway call fails the transaction is marked failed before the error is returned.\n\nThis endpoint is public so the checkout page can call it without a merchant token.",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CardPaymentInput" },
            examples: {
              "One time payment": {
                value: {
                  cardDetails: {
                    pan: "5060990580000217499",
                    exp_date: "03/50",
                    cvv: "111",
                    pin: "1111",
                  },
                  amount: 25000,
                  customerDetails: {
                    firstName: "Ada",
                    lastName: "Eze",
                    email: "ada@example.com",
                    phone: "08031234567",
                  },
                  paymentType: "one_time",
                  businessId: "66f1a2b3c4d5e6f7a8b9c0d1",
                  productId: "66f1a2b3c4d5e6f7a8b9c0d2",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": dataResponse("The gateway response for the charge attempt.", {
          $ref: "#/components/schemas/CardPaymentResult",
        }),
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/pay/otp/verify": {
    post: {
      tags: ["Checkout"],
      summary: "Verify the OTP challenge",
      description:
        "Step two, only needed when the charge returned responseCode `VERIFY_OTP`. Send the paymentId and transactionId from step one together with the OTP the payer received.",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/OtpVerificationInput" },
          },
        },
      },
      responses: {
        "200": dataResponse("The gateway response for the OTP attempt.", {
          $ref: "#/components/schemas/OtpVerificationResult",
        }),
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/pay/confirm-payment": {
    get: {
      tags: ["Checkout"],
      summary: "Confirm and settle a payment",
      description:
        "Step three. Queries the gateway for the final state of the charge and, when it succeeded, marks the transaction successful, increments the lifetime spend of the customer and credits the available balance of the business. Call it once after a successful charge or OTP verification, before showing the receipt.",
      security: [],
      parameters: [
        {
          name: "trxRef",
          in: "query",
          required: true,
          description: "The transactionRef returned by the charge.",
          schema: { type: "string" },
          example: "TRX-9F2C7A45B1D8",
        },
        {
          name: "amount",
          in: "query",
          required: true,
          description: "The charged amount in naira.",
          schema: { type: "string" },
          example: "25000",
        },
        {
          name: "businessId",
          in: "query",
          required: true,
          description: "Business that owns the payment link.",
          schema: { $ref: "#/components/schemas/ObjectId" },
        },
      ],
      responses: {
        "200": dataResponse("The settled payment record from the gateway.", {
          $ref: "#/components/schemas/PaymentConfirmation",
        }),
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
};

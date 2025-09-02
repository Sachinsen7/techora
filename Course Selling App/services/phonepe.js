const crypto = require("crypto");
const axios = require("axios");

class PhonePeService {
  constructor() {
    this.merchantId = process.env.PHONEPE_MERCHANT_ID;
    this.saltKey = process.env.PHONEPE_SALT_KEY;
    this.saltIndex = process.env.PHONEPE_SALT_INDEX || 1;
    this.baseUrl =
      process.env.PHONEPE_BASE_URL ||
      "https://api-preprod.phonepe.com/apis/pg-sandbox";
    this.redirectUrl = process.env.PHONEPE_REDIRECT_URL;
    this.webhookUrl = process.env.PHONEPE_WEBHOOK_URL;
  }

  generateChecksum(payload) {
    const string = payload + "/pg/v1/pay" + this.saltKey;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    return sha256 + "###" + this.saltIndex;
  }

  generateStatusChecksum(merchantTransactionId) {
    const string =
      `/pg/v1/status/${this.merchantId}/${merchantTransactionId}` +
      this.saltKey;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    return sha256 + "###" + this.saltIndex;
  }

  verifyWebhookChecksum(payload, receivedChecksum) {
    const string = payload + this.saltKey;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const expectedChecksum = sha256 + "###" + this.saltIndex;
    return expectedChecksum === receivedChecksum;
  }

  async createPayment(paymentData) {
    try {
      const {
        merchantTransactionId,
        amount,
        userId,
        courseId,
        userPhone,
        userEmail,
      } = paymentData;

      const payload = {
        merchantId: this.merchantId,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: userId,
        amount: amount,
        redirectUrl: `${this.redirectUrl}?transactionId=${merchantTransactionId}`,
        redirectMode: "POST",
        callbackUrl: this.webhookUrl,
        mobileNumber: userPhone,
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
        "base64"
      );
      const checksum = this.generateChecksum(base64Payload);

      const response = await axios.post(
        `${this.baseUrl}/pg/v1/pay`,
        {
          request: base64Payload,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
          },
        }
      );

      return {
        success: true,
        data: response.data,
        paymentUrl: response.data.data?.instrumentResponse?.redirectInfo?.url,
      };
    } catch (error) {
      console.error(
        "PhonePe payment creation error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async checkPaymentStatus(merchantTransactionId) {
    try {
      const checksum = this.generateStatusChecksum(merchantTransactionId);

      const response = await axios.get(
        `${this.baseUrl}/pg/v1/status/${this.merchantId}/${merchantTransactionId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
            "X-MERCHANT-ID": this.merchantId,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        "PhonePe status check error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  processWebhook(payload, checksum) {
    try {
      if (!this.verifyWebhookChecksum(payload, checksum)) {
        return {
          success: false,
          error: "Invalid checksum",
        };
      }

      const decodedPayload = JSON.parse(
        Buffer.from(payload, "base64").toString()
      );

      return {
        success: true,
        data: decodedPayload,
      };
    } catch (error) {
      console.error("PhonePe webhook processing error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  generateTransactionId(prefix = "TXN") {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }
}

module.exports = new PhonePeService();

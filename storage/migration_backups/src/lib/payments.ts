import crypto from 'crypto';

export interface PaymentConfig {
  merchantId?: string;
  hashKey?: string;
  hashIv?: string;
  apiUrl?: string;
  linePayChannelId?: string;
  linePayChannelSecret?: string;
  linePayApiUrl?: string;
}

export class PaymentEngine {
  private config: PaymentConfig;

  constructor() {
    this.config = {
      merchantId: process.env.NEXT_PUBLIC_ECPAY_MERCHANT_ID || '2000132',
      hashKey: process.env.ECPAY_HASH_KEY || '5294y06JbISpM5x9',
      hashIv: process.env.ECPAY_HASH_IV || 'v77hoKGq4kWxNNIS',
      apiUrl: process.env.ECPAY_API_URL || 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
      linePayChannelId: process.env.NEXT_PUBLIC_LINEPAY_CHANNEL_ID,
      linePayChannelSecret: process.env.LINEPAY_CHANNEL_SECRET,
      linePayApiUrl: process.env.LINEPAY_API_URL || 'https://sandbox-api-pay.line.me',
    };
  }

  /**
   * ==========================================
   * 1. 綠界科技 (ECPay) 金流介面實作
   * ==========================================
   */

  /**
   * 計算綠界科技的 CheckMacValue 安全加密簽章
   */
  public generateECPaySignature(params: Record<string, string | number>): string {
    const key = this.config.hashKey;
    const iv = this.config.hashIv;

    if (!key || !iv) {
      console.warn('⚠️ [PaymentEngine] 警告: 未配置 ECPay HashKey / HashIV，無法計算正確簽章。');
      return 'MOCK_SIGNATURE';
    }

    // 1. 參數按英文字母排序
    const sortedKeys = Object.keys(params).sort();
    
    // 2. 拼接字串
    let rawString = `HashKey=${key}&`;
    for (const k of sortedKeys) {
      if (k === 'CheckMacValue') continue;
      rawString += `${k}=${params[k]}&`;
    }
    rawString += `HashIV=${iv}`;

    // 3. URL Encode
    let encoded = encodeURIComponent(rawString)
      .replace(/%2d/g, '-')
      .replace(/%5f/g, '_')
      .replace(/%2e/g, '.')
      .replace(/%21/g, '!')
      .replace(/%2a/g, '*')
      .replace(/%28/g, '(')
      .replace(/%29/g, ')')
      .replace(/%20/g, '+');

    // 4. 轉小寫 -> SHA256 雜湊 -> 轉大寫
    encoded = encoded.toLowerCase();
    const hash = crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();

    return hash;
  }

  /**
   * 建立綠界科技自動跳轉的 HTML 表單內容
   */
  public createECPayOrder(data: {
    orderId: string;
    amount: number;
    description: string;
    returnUrl: string;
    clientBackUrl?: string;
  }) {
    const today = new Date();
    // 綠界需要的時間格式: yyyy/MM/dd HH:mm:ss
    const tradeDate = today.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/-/g, '/');

    const params: Record<string, string | number> = {
      MerchantID: this.config.merchantId || '2000132',
      MerchantTradeNo: data.orderId,
      MerchantTradeDate: tradeDate,
      PaymentType: 'aio',
      TotalAmount: data.amount,
      TradeDesc: data.description.substring(0, 100),
      ItemName: data.description.substring(0, 100),
      ReturnURL: data.returnUrl,
      ChoosePayment: 'ALL',
      EncryptType: 1,
      ClientBackURL: data.clientBackUrl || '',
    };

    // 計算簽章
    params.CheckMacValue = this.generateECPaySignature(params);

    // 建立表單自動提交 HTML
    const formFields = Object.keys(params)
      .map(k => `<input type="hidden" name="${k}" value="${params[k]}" />`)
      .join('\n');

    const html = `
      <form id="ecpay-form" method="POST" action="${this.config.apiUrl}">
        ${formFields}
      </form>
      <script>document.getElementById("ecpay-form").submit();</script>
    `;

    return {
      success: true,
      checkoutUrl: this.config.apiUrl,
      params,
      html,
    };
  }

  /**
   * 驗證綠界回傳的 Webhook POST 簽章
   */
  public verifyECPayFeedback(feedback: Record<string, any>): boolean {
    const receivedMac = feedback.CheckMacValue;
    if (!receivedMac) return false;

    // 拷貝並移除簽章欄位進行計算
    const params = { ...feedback };
    delete params.CheckMacValue;

    const computedMac = this.generateECPaySignature(params);
    return computedMac === receivedMac;
  }

  /**
   * ==========================================
   * 2. LINE Pay 行動支付介面實作
   * ==========================================
   */

  /**
   * 計算 LINE Pay V3 HmacSHA256 簽章標頭
   */
  private generateLinePaySignature(uri: string, body: string, nonce: string): string {
    const secret = this.config.linePayChannelSecret;
    if (!secret) return 'MOCK_LINEPAY_SIGNATURE';

    const signatureString = secret + uri + body + nonce;
    return crypto
      .createHmac('sha256', secret)
      .update(signatureString)
      .digest('base64');
  }

  /**
   * 建立 LINE Pay 預約交易訂單
   */
  public async createLinePayOrder(data: {
    orderId: string;
    amount: number;
    description: string;
    confirmUrl: string;
    cancelUrl: string;
  }) {
    // 檢查是否有配置金鑰，若無則自動降級為極速 Mock 跳轉
    if (!this.config.linePayChannelId || !this.config.linePayChannelSecret) {
      console.warn('⚠️ [PaymentEngine] 未配置 LINE Pay 金鑰，自動安全降級為 Sandbox 模擬流程。');
      
      const mockPayUrl = `/api/payment-mock-gateway?gateway=linepay&orderId=${data.orderId}&amount=${data.amount}&confirmUrl=${encodeURIComponent(data.confirmUrl)}&cancelUrl=${encodeURIComponent(data.cancelUrl)}`;
      
      return {
        success: true,
        paymentUrl: mockPayUrl,
        isMock: true,
      };
    }

    const uri = '/v3/payments/request';
    const nonce = crypto.randomUUID();
    
    const requestBody = {
      amount: data.amount,
      currency: 'TWD',
      orderId: data.orderId,
      packages: [
        {
          id: `pkg-${data.orderId}`,
          amount: data.amount,
          name: '雲端宮廟金流服務',
          products: [
            {
              name: data.description.substring(0, 100),
              quantity: 1,
              price: data.amount,
            },
          ],
        },
      ],
      redirectUrls: {
        confirmUrl: data.confirmUrl,
        cancelUrl: data.cancelUrl,
      },
    };

    const bodyString = JSON.stringify(requestBody);
    const signature = this.generateLinePaySignature(uri, bodyString, nonce);

    try {
      const response = await fetch(`${this.config.linePayApiUrl}${uri}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LINE-ChannelId': this.config.linePayChannelId,
          'X-LINE-Authorization-Nonce': nonce,
          'X-LINE-Authorization': signature,
        },
        body: bodyString,
      });

      const resData = await response.json();
      
      if (resData.returnCode === '0000') {
        return {
          success: true,
          paymentUrl: resData.info.paymentUrl.web,
          transactionId: resData.info.transactionId,
          isMock: false,
        };
      } else {
        return {
          success: false,
          error: resData.returnMessage,
        };
      }
    } catch (err: any) {
      console.error('❌ [PaymentEngine] LINE Pay API 呼叫發生錯誤:', err);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * LINE Pay 確認交易（完成付款撥發）
   */
  public async confirmLinePayPayment(transactionId: string, amount: number) {
    if (!this.config.linePayChannelId || !this.config.linePayChannelSecret) {
      return { success: true, isMock: true };
    }

    const uri = `/v3/payments/${transactionId}/confirm`;
    const nonce = crypto.randomUUID();
    const requestBody = {
      amount,
      currency: 'TWD',
    };

    const bodyString = JSON.stringify(requestBody);
    const signature = this.generateLinePaySignature(uri, bodyString, nonce);

    try {
      const response = await fetch(`${this.config.linePayApiUrl}${uri}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LINE-ChannelId': this.config.linePayChannelId,
          'X-LINE-Authorization-Nonce': nonce,
          'X-LINE-Authorization': signature,
        },
        body: bodyString,
      });

      const resData = await response.json();
      return {
        success: resData.returnCode === '0000',
        message: resData.returnMessage,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

// 導出全域單例金流中樞
export const payments = new PaymentEngine();
export default payments;

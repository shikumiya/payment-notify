// 明細記録用SpreadsheetのID
const SPREADSHEET_ID = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
// Slackの設定 ---
// トークン
const SLACK_BOT_TOKEN = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
// 投稿先のチャンネルID
const SLACK_CHANNEL_ID = 'XXXXXXXXXX'

// MF Cloudの設定 --
// ログインID
const MF_LOGIN_ID = 'XXXXXXXXXX'
// パスワード
const MF_LOGIN_PASSWORD = 'XXXXXXXXXX'

/**
 *  MFクラウドコントローラークラス
 */
class MoneyForwardCloudController {
  /**
   * コンストラクタ
   */
  constructor() {
    // MFクライアントを生成
    this._mfClient = MoneyForwardCloudClientFactory.create()
    
    // 管理用のスプレッドシートを取得
    this._ss = SpreadsheetApp.openById(SPREADSHEET_ID)
    // ロジックのインスタンスを取得
    this._mfLogic = MoneyForwardCloudBizLogicFactory.create(this._ss)
  }
  
  /**
   * MFクラウドへログイン
   * @param {string} id - ログインID
   * @param {string} password - パスワード
   */
  login(id, password) {
    // ログイン
    this._mfClient.login(id, password)
  }
 
  /**
   * 入金通知
   * @param {string} token - Slackトークン
   */
  notifyPayment(token) {
    // 明細を取得
    const actsParams = TransListActsParamsFactory.create()
    const transListContentText = this._mfClient.getTransList(actsParams)
    
    // 口座マスタシートを取得
    const accountSheet = this._ss.getSheetByName('口座マスタ')
    
    // Spreadsheetに新規分の明細書き出しとSlackに通知
    const paymentNotifier = new MoneyFowardCloudPaymentNotifier(token, accountSheet)
    this._mfLogic.notifyPayment(transListContentText, paymentNotifier)
  }
  
  /**
   * 一括取得
   */
  bulkCreate() {
    this._mfClient.bulkCreate()
  }
  
  /**
   * 口座マスタ同期
   */
  syncAccountMaster() {
    // 口座リスト取得
    const accountAndSubAccountList = this._mfClient.getAccountAndSubAccountList()
    this._mfLogic.syncAccountMaster(accountAndSubAccountList)
  }
}

/**
 * 入金通知
 */
function main() {
  const controller = new MoneyForwardCloudController()
  // ログイン
  controller.login(MF_LOGIN_ID, MF_LOGIN_PASSWORD)
  // 入金通知
  controller.notifyPayment(SLACK_BOT_TOKEN)
}

/**
 * 一括取得
 */
function refresh() {
  const controller = new MoneyForwardCloudController()
  // ログイン
  controller.login(MF_LOGIN_ID, MF_LOGIN_PASSWORD)
  // 一括取得
  controller.bulkCreate()
}

/**
 * マスタ同期
 */
function syncMasters() {
  const controller = new MoneyForwardCloudController()
  // ログイン
  controller.login(MF_LOGIN_ID, MF_LOGIN_PASSWORD)
  // 口座マスタ同期
  controller.syncAccountMaster()
}
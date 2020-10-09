/**
 * MFクラウド 入金通知クラス
 */
class MoneyFowardCloudPaymentNotifier {
  
  /**
   * コンストラクタ
   * @param {string} token - Slackトークン
   * @param {Sheet} aacountSheet - 口座マスタシート
   */
  constructor(token, accountSheet) {
    this.token = token
    this.accountSheet = accountSheet
  }
  
  // ==================================================
  // Public Methods
  // ==================================================  
  /**
   * 通知処理
   * @param {MoneyFowardCloudPaymentDetailEntity} entity - エンティティ
   * @return {bool} - true:通知済み、false:通知なし
   */
  notify(entity) {
    let notified = false
    
    // 通知対象の場合のみ処理
    if (this._notifyFilter(entity)) {
      const accountRow = this._getAccountRow(entity)
      console.log(accountRow)
      if (!accountRow) {
        // 該当の口座マスタが見つからない場合は通知せずに終了
        return false
      }
      
      // 口座名（別名がある場合は別名を適用）
      const otherName = accountRow[2]
      let accountName = entity.account + ' ' + entity.subAccount
      if (otherName != '') {
        accountName = otherName
      }
      // アイコン
      let icon = accountRow[3]
      
      // コンテンツ
      const blocks = this._makeBlocks(accountName, entity)
      
      let payload = {
        "channel": SLACK_CHANNEL_ID,
        "icon_emoji": icon,
        "blocks": JSON.stringify(blocks),
        'username': '入金通知bot ' + DateUtil.now('yyyy-MM-dd HH:mm:ss.SSS'), // 同じだとまとめられてしまい絵文字が個別表示されないため日時を付与
      }
      
      const slackApiClient = new SlackApiClient(this.token)
      // Slack通知
      const response = slackApiClient.chatPostMessage(payload)
      
      console.log(response.getContentText())
      
      // 通知済み
      notified = true
    }
    return notified
  }
  
  // ==================================================
  // Private Methods
  // ==================================================
  /**
   * 口座マスタの行を取得
   * @param {MoneyFowardCloudPaymentDetailEntity} entity - エンティティ
   * @return {Array|bool} 口座マスタが見つかった場合は行データ取得、それ以外はfalse
   */
  _getAccountRow(entity) {
    const accountSheet = this.accountSheet
    
    // 口座マスタのデータ行を全取得
    const lastRow = accountSheet.getLastRow()
    const accountRows = accountSheet.getRange(2, 1, lastRow, 5).getValues()
    
    for (const accountRow of accountRows) {
      // 一致するものを探索
      const accountName = StringUtil.replaceAll(accountRow[0], ' ', '')
      const subAccountName = StringUtil.replaceAll(accountRow[1], ' ', '')
      if (entity.account == accountName && entity.subAccount == subAccountName) {
        return accountRow
      }
    }
    
    return false
  }
  
  /**
   * 通知のフィルタリング処理
   * @param {MoneyFowardCloudPaymentDetailEntity} entity - エンティティ
   * @return {bool} - true:通知する、false:通知しない
   */
  _notifyFilter(entity) {
    const accountSheet = this.accountSheet
    
    const accountLastRow = accountSheet.getLastRow()
    
    const accountRows = accountSheet.getRange(2, 1, accountLastRow, 5).getValues()
    
    for (const accountRow of accountRows) {
      const accountName = accountRow[0]
      const notifyFlag = accountRow[4]
      
      // 通知ONの口座のみ
      if (entity.account.indexOf(accountName) > -1 && notifyFlag == 'ON') {
        // 入金のみ
        if (entity.kingaku.indexOf('-') < 0 && entity.contents.indexOf('振込') == 0) {
          return true
        }
      }
    }
    
    return false
  }
  
  /**
   * Slack通知の本文を作成
   * @param {string} accountName - 口座名
   * @param {MoneyFowardCloudPaymentDetailEntity} entity - エンティティ
   * @return {Array} - 本文
   */
  _makeBlocks(accountName, entity) {
    const blocks = []
    blocks.push(SlackBlockBuilder.section().plainText(accountName + 'の口座に新しく入金がありました！'))
    blocks.push(SlackBlockBuilder.section().plainText("入金日：" + entity.date))
    blocks.push(SlackBlockBuilder.section().plainText("金額：" + entity.kingaku))
    blocks.push(SlackBlockBuilder.section().plainText("内容：" + entity.contents))
    return blocks
  }
}


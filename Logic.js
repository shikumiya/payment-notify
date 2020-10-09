/**
 * MFクラウド 業務ロジックファクトリクラス
 */
class MoneyForwardCloudBizLogicFactory {
  
  /**
   * 業務ロジッククラスのインスタンスを生成して取得
   * @param {Spreadsheet} ss - 管理用のスプレッドシート
   */
  static create(ss) {
    return new MoneyForwardCloudBizLogic(new CheerioLoader(), ss)
  }
}

/**
 * MFクラウド 業務ロジッククラス
 */
class MoneyForwardCloudBizLogic {
  
  /**
   * コンストラクタ
   * @param {SelecterLoader} selectorLoader - CSSセレクタベースのローダー
   * @param {Spreadsheet} ss - 管理用のスプレッドシート
   */
  constructor(selectorLoader, ss) {
    this.loader = selectorLoader
    this.ss = ss
  }
  
  // ==================================================
  // Public Methods
  // ==================================================
  /**
   * 入金通知
   * @param {string} detailHtml - 明細HTML
   * @param {Notifier} notifier - 通知オブジェクト
   */
  notifyPayment(detailHtml, notifier) {
    // 明細シートを取得
    const sheet = this.ss.getSheetByName('明細')
    
    // ローダーで明細HTMLを読み込み
    const $ = this.loader.load(this._getDetailHtml(detailHtml))
    
    // 明細行からエンティティへ変換
    const entities = this._getDetailEntities($)
    
    // 通知&明細登録
    this._notify(entities, notifier, sheet)
  }
  
  /**
   * 口座マスタの同期処理
   * @param {Array} accountAndSubAccountList - MFから取得した口座とサブ口座のリスト
   */
  syncAccountMaster(accountAndSubAccountList) {
    // 口座マスタシート取得
    const sheet = this.ss.getSheetByName('口座マスタ')
    
    const lastRow = sheet.getLastRow()
    const rows = sheet.getRange(2, 1, lastRow, 2).getValues()
    
    let values = []
    
    // 口座名とサブ口座名をセットで処理
    for (const account of accountAndSubAccountList) {
      const accountName = account['account']
      const subAccountNames = account['subAccount']
      
      // マスタの存在チェック
      for (const subAccountName of subAccountNames) {
        let hasAccount = false
        for (const row of rows) {
          if (accountName == row[0] && subAccountName == row[1]) {
            hasAccount = true
            break
          }
        }
        
        // 新規
        if (!hasAccount) {
          let rowValues = []
          rowValues.push(accountName)
          rowValues.push(subAccountName)
          rowValues.push('')
          rowValues.push('')
          rowValues.push('OFF')
          values.push(rowValues)
        }
      }
    }
    
    // マスタシート書き込み
    if (values.length > 0) {
      sheet.getRange(lastRow+1, 1, values.length, 5).setValues(values)
    }
  }
  
  // ==================================================
  // Private Methods
  // ==================================================
  /**
   * 解析用の明細HTML作成
   * @param {string} html - 明細HTML
   * @return {string} - 解析用のHTML
   */
  _getDetailHtml(html) {
    return '<html><body><table><tbody>' + html + '</tbody></table></body></html>'
  }
  
  /**
   * 明細行の要素からエンティティクラスのリストを作成
   * @param {Array} trs - TR要素の配列
   * @return {Array} - MoneyFowardCloudPaymentDetailEntityクラスの配列
   */
  _getDetailEntities($) {
    const trs = $('tr')
    const entities = []
    
    trs.each(function(trIdx, tr) {
      const tds = $(tr).children()
      let entity = new MoneyFowardCloudPaymentDetailEntity(
        $(tds[1]).text(),
        $(tds[2]).text(),
        $(tds[3]).text(),
        $($(tds[5]).contents()[0]).text(),
        $($(tds[5]).contents()[1]).text()
      )
      
      entities.push(entity)
    })
    
    return entities
  }
  
  /**
   * 既存データの判定
   * @param {Array} rows - 明細行の配列
   * @param {MoneyFowardCloudPaymentDetailEntity} entity - エンティティ
   * @return {bool} - true:既存, false:新規
   */
  _hasData(rows, entity) {
    const jointText = entity.getUniqueValue()
    
    let hasData = false
    for (const row of rows) {
      const rowText = DateUtil.format(new Date(row[0]), 'yyyy/MM/dd') + row[1] + row[2] + row[3] + row[4]
      
      if (jointText == rowText) {
        hasData = true
      }
    }
    
    return hasData
  }
  
  /**
   * 通知処理
   * @param {Array} entities - 処理対象のエンティティリスト
   * @param {Notifier} notifier - 通知クライアント
   * @param {Sheet} sheet - 通知結果を書き出す明細シート
   */
  _notify(entities, notifier, sheet) {
    const lastRow = sheet.getLastRow()
    const rows = sheet.getRange(2, 1, lastRow, 5).getValues()
    
    let values = []
    
    for (const entity of entities) {
      // 新規の場合
      if (!this._hasData(rows, entity)) {
        // エンティティを行データへ変換
        let rowValues = entity.getRowValues()
        
        // 通知先へ通知
        let notified = notifier.notify(entity)
        
        if (notified) {
          // 通知済みの場合は通知日時をセット
          rowValues.push(DateUtil.now())
        } else {
          // 通知失敗時は未通知扱い
          rowValues.push('')
        }
        values.push(rowValues)
      }
    }
    
    // 明細シートに書き出し
    if (values.length > 0) {
      sheet.getRange(lastRow+1, 1, values.length, 6).setValues(values)
    }
  }
}

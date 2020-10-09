/**
 * MFクラウド明細エンティティクラス
 */
class MoneyFowardCloudPaymentDetailEntity {
  
  /**
   * コンストラクタ
   */
  constructor(date, contents, kingaku, account, subAccount) {
    this._date = date
    this._contents = contents
    this._kingaku = kingaku
    this._account = account
    this._subAccount = subAccount
  }
  
  /**
   * 日付のgetter
   * @return {string} - 日付
   */
  get date() {
    return this._date
  }
  
  /**
   * 内容のgetter
   * @return {string} - 内容
   */
  get contents() {
    return this._contents
  }
  
  /**
   * 金額のgetter
   * @return {string} - 金額
   */
  get kingaku() {
    return this._kingaku
  }
  
  /**
   * 連携サービス1のgetter
   * @return {string} - 連携サービス1
   */
  get account() {
    return this._account
  }
  
  /**
   * 連携サービス2のgetter
   * @return {string} - 連携サービス2
   */
  get subAccount() {
    return this._subAccount
  }
  
  /**
   * 存在チェック用のユニーク値を取得
   * @return {string} - ユニーク値
   */
  getUniqueValue() {
    return this.date + this.contents + this.kingaku + this.account + this.subAccount
  }
  
  /**
   * エンティティから1行分の行データを生成
   * @return {Array} - 行データの2次元配列
   */
  getRowValues() {
    let rowValues = []
    rowValues.push(this.date)
    rowValues.push(this.contents)
    rowValues.push(this.kingaku)
    rowValues.push(this.account)
    rowValues.push(this.subAccount)
    
    return rowValues
  }
  
}
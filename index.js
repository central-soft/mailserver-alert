const config = require('config');
const nodemailer = require('nodemailer');

// メール準備
const SMTP = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port
});
const MAIL_TEXT_TOP =
`
現在、メールサーバの個人容量が上限に達しています。
メールボックス内の整理をお願いします。
詳細： ${config.mailHeader.url}

★情報★
上限： ${config.size.max}MB
`
const MAIL_TEXT_BOTTOM =
`


！！注意！！
対応いただけない場合、個別に連絡を取らせていただきます。

※本メールへの返信は禁止とします。
※本メールは情報基盤WGが管理するシステムから送信されています。
　お問い合わせ先： ${config.mailHeader.contact}
`

/**
 * CSVファイルの読み込みを行う関数
 * @param {string} filePath - CSVファイルパス
 * @return {object} 読み込み結果(JSONオブジェクト)
 */
const getDataFromFile = (filePath) => {
  const fs = require('fs');
  const csv = require('csv');
  return new Promise((resolve, reject) => {
    const src = fs.createReadStream(filePath);
    src.pipe(csv.parse({columns: true}, (err, data) => {
      if (err) { reject(err); return; }
      resolve(data);
    }));
  });
};

/**
 * メール情報を作成する関数
 * @param {string} user - 対象ユーザ名
 * @param {string} size - 使用量
 * @return {object} メール情報
 */
const createMessage = (user, size) => {
  return {
    from: config.mailHeader.from,
    to: user + config.mailHeader.domain,
    subject: config.mailHeader.subject,
    text: MAIL_TEXT_TOP + `使用量： ${size}MB` + MAIL_TEXT_BOTTOM
  }
};


/**
 * メイン処理
 */
const main = async () => {
  // ファイルサーバからデータを取得（マシン上にマウント済みであること）
  const filePath = config.csv.directory + config.csv.filename;
  const data = await getDataFromFile(filePath);

  data.forEach((userInfo) => {
    // 上限未満の場合、スキップ
    if (userInfo.size < config.size.max) return;

    // メール情報作成
    let message = createMessage(userInfo.user, userInfo.size);

    // 送信
    SMTP.sendMail(message, (err, info) => {
      if (err) {
        console.log('send failed: ' + message.to);
        console.log(err.message);
      }
    });
  });
};


// node-cronを利用して定期実行する
(() => {
  const cron = require('node-cron');
  // TODO: 現状、10秒間隔で実行
  cron.schedule(config.schedule.cron, () => main());
})();

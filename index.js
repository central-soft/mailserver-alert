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
詳細：｛コンフルURL｝

★情報★
上限： ${config.size.max}MB
`
const MAIL_TEXT_BOTTOM =
`


！！注意！！
対応いただけない場合、個別に連絡を取らせていただきます。

※本メールへの返信は禁止とします。
※本メールは情報基盤WGが管理するシステムから送信されています。
　お問い合わせ先：｛メールアドレス｝
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
}


/**
 * メイン処理
 */
(async () => {
  // ファイルサーバからデータを取得（マシン上にマウント済みであること）
  const filePath = config.csv.directory + config.csv.filename;
  const data = await getDataFromFile(filePath);

  let overUserCont = 0;
  data.forEach((userInfo) => {
    // 上限未満の場合、スキップ
    if (userInfo.size < config.size.max) return;
    overUserCont++;

    // メール本文組み立て
    let mailText = MAIL_TEXT_TOP +
      `使用量： ${userInfo.size}MB` +
      MAIL_TEXT_BOTTOM;

    // メール情報作成
    let message = {
      from: config.mailHeader.from,
      to: userInfo.user + config.mailHeader.domain,
      subject: config.mailHeader.subject,
      text: mailText
    }

    // 送信
    SMTP.sendMail(message, (err, info) => {
      if (err) {
        console.log('send failed: ' + message.to);
        console.log(err.message);
      }
    });
  });
})();

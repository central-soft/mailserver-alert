const config = require('config');
const nodemailer = require('nodemailer');
const moment = require('moment');
moment.locale('ja');

// メール準備
const SMTP = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, //SSL
  user: config.smtp.user,
  pass: config.smtp.password
});
const MAIL_TEXT_TOP =
`
現在、メールサーバの使用量が上限に達しています。
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
    src.on('error', (err) => { reject(err); });
    src.pipe(csv.parse({columns: true}, (err, data) => {
      if (err) { reject(err); }
      resolve(data);
    }));
  });
};


/**
 * メール情報を作成する関数
 * @param {string} mail - 対象メールアドレス
 * @param {string} size - 使用量
 * @return {object} メール情報
 */
const createMessage = (mail, size) => {
  return {
    from: config.mailHeader.from,
    to: mail,
    subject: config.mailHeader.subject,
    text: MAIL_TEXT_TOP + `使用量： ${size}MB` + MAIL_TEXT_BOTTOM
  }
};


/**
 * メイン処理
 */
const main = async () => {
  const iconv = require("iconv-lite");

  // ファイルサーバからデータを取得（マシン上にマウント済みであること）
  let data;
  // TODO: 現在テスト用に日付を固定中
  const targetDate = moment('2019-01-01').day(-1); // {6 - 7} => {土曜 - 7} => {前回の土曜日}
  const fileName = targetDate.format('YYYYMMDD') + config.csv.filename_bottom;
  const filePath = config.csv.directory + fileName;
  try {
    data = await getDataFromFile(filePath);
  } catch (err) {
    console.log(`ファイルの読み込みに失敗しました：${filePath}`)
    console.log(err);
    return;
  }

  // メールアドレスごとに処理していく
  data.forEach((userInfo) => {
    // 上限未満の場合、スキップ
    if (userInfo.size < config.size.max) return;

    // メール情報作成
    const message = iconv.encode(createMessage(userInfo.mail, userInfo.size), 'utf-8');

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

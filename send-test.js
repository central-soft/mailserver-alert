const nodemailer = require('nodemailer');
const iconv = require("iconv-lite");
const SMTP = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  auth: 'xxx@mucho.co.jp',
  pass: 'abcdefg'
});

const TEST_SUBJECT = 'これはテストメールです。'
const TEST_MESSAGE = 'メッセージ';

(() => {
  const message = {
    from: 'test@mucho.co.jp',
    to: 'test@mucho.co.jp',
    subject: TEST_SUBJECT,
    text: iconv.encode(TEST_MESSAGE, 'utf-8')
  };
  SMTP.sendMail(message, (err, info) => {
    if (err) {
      console.log('send failed: ' + message.to);
      console.log(err.message);
    }
  });
})();

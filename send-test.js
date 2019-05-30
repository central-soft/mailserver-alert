const nodemailer = require('nodemailer');
const SMTP = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: true,
  auth: 'xxx@mucho.co.jp',
  pass: 'abcdefg'
});

(() => {
  const message = {
    from: 'test@mucho.co.jp',
    to: 'test@mucho.co.jp',
    subject: config.mailHeader.subject,
    text: MAIL_TEXT_TOP + `使用量： ${size}MB` + MAIL_TEXT_BOTTOM
  };
  SMTP.sendMail(message, (err, info) => {
    if (err) {
      console.log('send failed: ' + message.to);
      console.log(err.message);
    }
  });
})();

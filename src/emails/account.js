const sgMail = require('@sendgrid/mail');

const sendgridAPIKey = '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';

sgMail.setApiKey(sendgridAPIKey);

sgMail.send({
    to: "andrew@mead.io",
    from: "rajdebojit@gmail.com",
    subject: "Automatic Mail via Node JS Application",
    text: "Hurray! I can now send mails automatically using NODE JS and SendGrid API."
}).then(()=> {
    console.log('Email Sent!');
}).catch((e) => {
    console.log(e);
})
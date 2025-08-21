const sgMail = require("@sendgrid/mail");

const { renderTemplate } = require("./emailTemplate");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendWelcomeEmail = async (to, magicLink) => {
  const html = renderTemplate("welcome-email", {
    APP_NAME: process.env.APP_NAME,
    LOGO_URL:
      "https://equalengineers.com/wp-content/uploads/2024/04/dummy-logo-5b.png",
    MAGIC_LINK: magicLink,
    YEAR: new Date().getFullYear(),
  });

  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "Welcome to " + process.env.APP_NAME,
    html,
  });
};

exports.sendLoginEmail = async (to, magicLink) => {
  const html = renderTemplate("login-email", {
    APP_NAME: process.env.APP_NAME,
    LOGO_URL:
      "https://equalengineers.com/wp-content/uploads/2024/04/dummy-logo-5b.png",
    MAGIC_LINK: magicLink,
    YEAR: new Date().getFullYear(),
  });

  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "Login to " + process.env.APP_NAME,
    html,
  });
};

const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

exports.renderTemplate = (templateName, data) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    `${templateName}.hbs`
  );
  const source = fs.readFileSync(templatePath, "utf8");
  const template = Handlebars.compile(source);
  return template(data);
};

/* eslint-env node */
'use strict';

module.exports = {
  name: 'ember-intl-phone-input',

  included() {
    let findHost = this._findHost;
    let app = findHost.call(this);

    if (!app.__emberIntlPhoneInputIncluded) {

      let hasSass = !!app.registry.availablePlugins['ember-cli-sass'];
      let hasLess = !!app.registry.availablePlugins['ember-cli-less'];

      if (!hasSass && !hasLess) {
        app.import(`vendor/ember-intl-phone-input.css`);
      }

      app.__emberIntlPhoneInputIncluded = true;
    }
  },
};

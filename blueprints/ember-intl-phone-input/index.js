const RSVP = require('rsvp');

module.exports = {
  normalizeEntityName: function() {},

  afterInstall: function() {
    return RSVP.all([
      this.addPackageToProject('libphonenumber-js'),
      this.addAddonToProject('ember-browserify'),
    ]);
  }
};

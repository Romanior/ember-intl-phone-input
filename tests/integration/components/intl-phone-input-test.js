import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('intl-phone-input', 'Integration | Component | intl phone input', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{intl-phone-input}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#intl-phone-input}}
      template block text
    {{/intl-phone-input}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});

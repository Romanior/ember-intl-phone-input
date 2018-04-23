import Component from '@ember/component';
import layout from '../../templates/components/intl-phone-input/input';

export default Component.extend({
  tagName: '',
  layout,
  valueChanged() {},
  keyUpInput() {},

  actions: {
    valueChanged(value) {
      return this.valueChanged(value);
    },

    keyUpInput(value, event) {
      this.keyUpInput(value, event)
    }
  }
});

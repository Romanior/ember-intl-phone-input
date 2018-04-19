import Component from '@ember/component';
import layout from '../templates/components/intl-phone-input';
// import all from 'ember-intl-phone-input';
import libphonenumber from 'npm:libphonenumber-js';
// import showdown from 'showdown'

const { parseNumber, formatNumber, AsYouType } = libphonenumber;
//
export default Component.extend({
  layout,


  actions: {
    onKeydown() {

    },
    onKeyup() {
      debugger

      console.log(parseNumber);

      // console.log(parseNumber, formatNumber, AsYouType);
      parseNumber('8 (800) 555 35 35', 'RU')
// { country: 'RU', phone: '8005553535' }

      formatNumber({ country: 'US', phone: '2133734253' }, 'International')
      formatNumber('+12133734253', 'International')
// '+1 213 373 4253'

      new AsYouType().input('+12133734')
// '+1 213 373 4'
      new AsYouType('US').input('2133734')

      // debugger;
    }
  }

});

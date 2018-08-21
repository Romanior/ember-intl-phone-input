import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { readOnly, alias } from '@ember/object/computed';
import { assert } from '@ember/debug';
import { parseNumber, formatNumber, AsYouType, isValidNumber } from 'libphonenumber-js';

import EXAMPLES from 'libphonenumber-js/examples.mobile.json';

import layout from '../templates/components/intl-phone-input';
import FORMATS from '../utils/formats';
import { searchProbableCountry, findCountryObjectByIsoCode, COUNTRY_OPTIONS } from '../utils/phone-tools';
import sanitizePhone from '../utils/raw-value';

const { assign } = Object;

export default Component.extend({
  autocomplete: 'off',
  inputClassName: 'ember-intl-phone-input__input',
  classNames: ['ember-intl-phone-input'],
  hasDropDown: true,
  phone: '',
  country: '',

  layout,
  showExampleAsPlaceholder: true,

  format: FORMATS.INTERNATIONAL,
  countryOptions: COUNTRY_OPTIONS,

  shouldFormatAsYouType: true,
  keepUserFormat: false,

  disabled: false,
  readonly: false,

  inputType: 'text',
  inputComponent: 'intl-phone-input/input',

  // power select options
  searchEnabled: false,

  // actions
  keyUpInput() {},
  valueChanged() {},
  parseOnInit() {},
  onFocusInput() {},
  onBlurInput() {},

  value: alias('phone'),
  countryCode: alias('country'),

  formattedValue: computed('phone', {
    get() {
      let selectedCountry = this.get('selectedCountryObj.country');
      let phone = this.get('phone');
      let keepUserFormat = this.get('keepUserFormat');

      if (!keepUserFormat) {
        phone = this.forceFormat(phone, selectedCountry);
      }
      return phone;
    },
    set(k, v) {
      return v
    }
  }),

  placeholder: computed('format', 'showExampleAsPlaceholder', 'selectedCountryObj.country', function() {
    let { showExampleAsPlaceholder, format, selectedCountryObj } =
      this.getProperties('showExampleAsPlaceholder', 'format', 'selectedCountryObj');

    if (showExampleAsPlaceholder) {
      let country = selectedCountryObj.country;
      return formatNumber({ country, phone: EXAMPLES[country] }, format)
    }
  }),

  asYouType: computed('country', 'selectedCountryObj.country', function() {
    let country = this.get('selectedCountryObj.country') || this.get('country');
    return new AsYouType(country);
  }),

  init() {
    this._super(...arguments);
    let { phone, country } = this.getProperties('phone', 'country');

    let formattedAsYouType = this.formatFromValueAction(phone);

    if (country) {
      this.set('selectedCountryObj', findCountryObjectByIsoCode(country));
    }

    this.parseOnInit(this.prepareForOutput(formattedAsYouType, this.get('selectedCountryObj')));
  },

  formatAsYouType(formattedValue, shouldFormat) {
    let formatted = formattedValue;
    if (shouldFormat) {
      let asYouType = this.get('asYouType');
      asYouType.reset();
      formatted = asYouType.input(formattedValue);
    }
    return formatted;
  },

  forceFormat(strToFormat, selectedCountry, format = this.get('format')) {
    let formatted;
    let parsed = parseNumber(strToFormat, selectedCountry);

    if (parsed.phone) {
      formatted = formatNumber(parsed, format)
    } else {
      formatted = formatNumber({ phone: strToFormat, country: selectedCountry }, format)
    }
    return formatted;
  },

  prepareForOutput(formattedValue, selectedCountryObj) {
    // try to parse formattedValue as correct number
    let parsed = parseNumber(formattedValue, selectedCountryObj.country);

    // if it does not work, just stripped out +, \s and -
    if (!parsed.phone) {
      parsed.phone = sanitizePhone(formattedValue).replace(selectedCountryObj.callingCode, '');
    }

    return assign({
      number: formatNumber(parsed.phone, selectedCountryObj.country, FORMATS.E164),
      probablyValidNumber: isValidNumber(formattedValue, selectedCountryObj.country)
    }, parsed, selectedCountryObj);
  },

  searchCountryBasedOnValue(phoneToSearch) {
    return searchProbableCountry(phoneToSearch, this.get('selectedCountryObj.country'));
  },

  formatFromValueAction(value) {
    let country = this.searchCountryBasedOnValue(value);
    let formattedAsYouType = this.formatAsYouType(value, this.get('shouldFormatAsYouType'));

    if (country) {
      this.set('selectedCountryObj', findCountryObjectByIsoCode(country));
    }

    this.set('formattedValue', formattedAsYouType);
    return formattedAsYouType;
  },

  actions: {
    countryChanged(selectedCountryObj) {

      let previousCallingCode = this.get('selectedCountryObj.callingCode');
      let formattedValue = this.get('formattedValue');

      if (formattedValue) {
        // swap calling codes on input
        formattedValue = this.forceFormat(
          formattedValue.replace(previousCallingCode, selectedCountryObj.callingCode),
          selectedCountryObj
        );
      } else {
        formattedValue = `+${selectedCountryObj.callingCode} `
      }

      this.set('formattedValue', formattedValue);
      this.set('selectedCountryObj', selectedCountryObj);

      this.valueChanged(this.prepareForOutput(formattedValue, selectedCountryObj));
    },

    keyUpInput(value, event) {
      let formattedAsYouType = this.formatFromValueAction(value);
      this.keyUpInput(this.prepareForOutput(formattedAsYouType, this.get('selectedCountryObj')), event);
    },

    valueChanged(value, event) {
      let formattedAsYouType = this.formatFromValueAction(value);
      this.valueChanged(this.prepareForOutput(formattedAsYouType, this.get('selectedCountryObj')), event);
    },

    onFocusInput(value, event) {
      this.onFocusInput(this.prepareForOutput(value, this.get('selectedCountryObj')), event);
    },

    onBlurInput(value, event) {
      this.onBlurInput(this.prepareForOutput(value, this.get('selectedCountryObj')), event);
    }
  }

});

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import libphonenumber from 'npm:libphonenumber-js';
import metadata from 'npm:libphonenumber-js/metadata.full.json';
import examples from 'npm:libphonenumber-js/examples.mobile.json';

import layout from '../templates/components/intl-phone-input';
import countries from '../utils/countries';
import FORMATS from '../utils/formats';
import LOCAL_CODES from '../utils/localcodes';
import rawValue from '../utils/raw-value';
import performSearchCountry from '../utils/perform-search-country';

const { countries: METADATA_COUNTRIES, country_calling_codes: CALLING_CODES } = metadata;
const { parseNumber, formatNumber, AsYouType } = libphonenumber;
const { keys, assign } = Object;

export default Component.extend({
  autocomplete: 'off',
  inputClassName: 'ember-intl-phone-input__input',
  classNames: ['ember-intl-phone-input'],
  hasDropDown: true,
  country: 'RU',
  countries,
  layout,
  showExampleAsPlaceholder: true,

  format: FORMATS.INTERNATIONAL,
  shouldFormatAsYouType: true,
  shouldFormatOnChange: true,
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

  value: computed('phone', 'selected.country', {
    get() {
      let selectedCountry = this.get('selected.country');
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

  selected: computed('country', function() {
    let country = String(this.get('country')).toUpperCase();
    return  this.findOptionByIsoCode(country);
  }),

  placeholder: computed('country', 'format', 'showExampleAsPlaceholder', 'selected.country', function() {
    let { showExampleAsPlaceholder, country, format, selected } =
      this.getProperties('showExampleAsPlaceholder', 'country', 'format', 'selected');

    if (showExampleAsPlaceholder) {
      country = get(selected, 'country') || country;
      return formatNumber({ country, phone: examples[country] }, format)
    }
  }),

  asYouType: computed('country', 'selected.country', function() {
    let country = this.get('selected.country') || this.get('country');
    return new AsYouType(country);
  }),

  init() {
    this._super(...arguments);
    this.setProperties(this.createCountryAndMetaLocalOptions(this.get('countries'), METADATA_COUNTRIES, LOCAL_CODES));
  },

  createCountryAndMetaLocalOptions(countries, metadata, localCodes) {
    let countryKeys = keys(countries);
    let countryOptions = [];
    let metaLocalCodes = {};

    for (let i = 0; i <= countryKeys.length; i++) {
      let country = countryKeys[i];
      let name = countries[country];
      let metadataCountry = metadata[country];

      if (metadataCountry) {
        let localCode = metadataCountry[9];
        let callingCode = metadataCountry[0];

        countryOptions.push({
          name, country, countryLowerCase: country.toLowerCase(), callingCode, localCode
        });

        if (localCode) {
          metaLocalCodes[country] = localCode;
        }

        if (localCodes[country]) {
          metaLocalCodes[country] = localCodes[country];
        }
      }

    }
    return { countryOptions, metaLocalCodes };
  },

  matcher(option = '', term = '') {
    option = String(get(option, 'name')).toLowerCase();
    term = String(term).toLowerCase();

    return option.startsWith(term) ? 1 : -1;
  },

  formatAsYouType(value, shouldFormat) {
    let formatted = value;
    if (shouldFormat) {
      let asYouType = this.get('asYouType');
      asYouType.reset();
      formatted = asYouType.input(value);
    }
    return formatted;
  },

  forceFormat(value, selectedCountry) {
    if (value) {
      let formatted;
      let format = this.get('format');
      let parsed = parseNumber(value, selectedCountry);

      if (parsed.phone) {
        formatted = formatNumber(parsed, format)
      } else {
        formatted = formatNumber({ phone: value, country: selectedCountry }, format)
      }
      return formatted;
    }
  },

  prepareForOutput(value, selected) {
    // try to parse value as correct number
    let parsed = parseNumber(value, selected.country);

    // if it does not work, just stripped out +, \s and -
    if (!parsed.phone) {
      parsed.phone = rawValue(value).replace(selected.callingCode, '');
    }

    return assign({ number: formatNumber(parsed.phone, selected.country, FORMATS.E164) }, parsed, selected);
  },

  searchCountryBasedOnValue(value, selectedCountry) {
    let hasPlusChar = new RegExp(/\+/).test(value);
    if (hasPlusChar) {
      let countryOptions = this.get('countryOptions');
      let metaLocalCodes = this.get('metaLocalCodes');
      let guessedCountries = this.get('guessedCountries');
      let { probCountry, probCountries } =
        performSearchCountry(value, selectedCountry, countryOptions, guessedCountries, metaLocalCodes, CALLING_CODES);

      this.set('guessedCountries', probCountries);
      return probCountry;
    }
  },

  findOptionByIsoCode(country) {
    let countryOptions = this.get('countryOptions');
    if (countryOptions) {
      return countryOptions.find(c => c.country === country);
    }
  },

  actions: {
    countryChanged(selected) {
      let previousCallingCode = this.get('selected.callingCode');
      let value = this.get('value');

      if (value) {
        // swap calling codes on input
        value = this.forceFormat(value.replace(previousCallingCode, selected.callingCode), selected);
      } else {
        value = `+${selected.callingCode} `
      }

      this.set('guessedCountries', null);
      this.set('value', value);
      this.set('selected', selected);

      this.valueChanged(this.prepareForOutput(value, selected));
    },

    keyUpInput(value, event) {
      let formattedValue = this.formatAsYouType(value, this.get('shouldFormatAsYouType'));
      let country = this.searchCountryBasedOnValue(formattedValue, this.get('selected.country'));

      if (country) {
        this.set('selected', this.findOptionByIsoCode(country));
      }

      this.keyUpInput(this.prepareForOutput(formattedValue, this.get('selected')), event);
      this.set('value', formattedValue);
    },

    valueChanged(value) {
      let formattedValue = this.formatAsYouType(value, this.get('shouldFormatOnChange'));
      let selected = this.get('selected');

      if (!this.get('keepUserFormat') && value) {
        formattedValue = this.forceFormat(formattedValue, this.get('selected.country'));
      }

      this.valueChanged(this.prepareForOutput(formattedValue, selected));

      this.set('value', formattedValue);
    }
  }

});

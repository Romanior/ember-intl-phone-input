import Component from '@ember/component';
import { get, set, computed } from '@ember/object';
import { or, reads } from '@ember/object/computed';
import { assert } from '@ember/debug';
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
const { keys, values, assign } = Object;

export default Component.extend({
  autocomplete: 'off',
  inputClassName: 'ember-intl-phone-input__input',
  classNames: ['ember-intl-phone-input'],
  hasDropDown: true,
  showExampleAsPlaceholder: true,
  country: 'RU',
  countries,
  layout,

  format: FORMATS.INTERNATIONAL,
  shouldFormatAsYouType: true,
  shouldFormatOnChange: true,
  keepUserFormat: false,
  value: reads('phone'),

  selected: {},
  disabled: false,
  readonly: false,
  inputType: 'text',
  inputComponent: 'intl-phone-input/input',

  // power select options
  searchEnabled: false,

  // actions
  keyUpInput() {},
  valueChanged() {},

  formatType: computed('format', {
    get() {
      let format = this.get('format');
      if (values(FORMATS).includes(format)) {
        return format;
      }
    }
  }).readOnly(),

  placeholder: computed('country', 'formatType', 'showExampleAsPlaceholder', 'selected.country', function() {
    let { showExampleAsPlaceholder, country, formatType, selected } =
      this.getProperties('showExampleAsPlaceholder', 'country', 'formatType', 'selected');

    if (showExampleAsPlaceholder) {
      let country = get(selected, 'country') || country;
      return formatNumber({ country: country, phone: examples[country] }, formatType)
    }
  }),

  asYouType: computed('country', 'selected.country', function() {
    let country = this.get('selected.country') || this.get('country');
    return new AsYouType(country);
  }),

  init() {
    this._super(...arguments);
    let value = this.get('value');
    let countries = this.get('countries');
    let keepUserFormat = this.get('keepUserFormat');
    let country = String(this.get('country')).toUpperCase();
    let { countryOptions, metaLocalCodes } = this.createCountryAndMetaLocalOptions(countries, METADATA_COUNTRIES, LOCAL_CODES);
    this.setProperties({ countryOptions, metaLocalCodes });

    let selected = countryOptions.find(c => c.country === country);
    assert(`${this.toString()}: "country" option should be from the list: ${countryOptions.mapBy('country')}`, !!selected);

    if (!keepUserFormat && value) {
      this.set('value', this.forceFormat(value, selected.country))
    }

    this.set('selected', selected);
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

    console.log(term, option);
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
    let formatted = value;
    let parsed = parseNumber(formatted, selectedCountry);

    if (parsed.phone) {
      formatted = formatNumber(parsed, this.get('format'))
    }
    return formatted;
  },

  prepareForOutput(value, selected) {
    if (value) {
      // try to parse value as correct number
      let parsed = parseNumber(value, selected.country);

      // if it does not work, just stripped out +, \s and -
      if (!parsed.phone) {
        parsed.phone = rawValue(value).replace(selected.callingCode, '');
      }

      return assign({}, parsed, selected);
    }
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
    return this.get('countryOptions').find(c => c.country === country);
  },

  actions: {
    countryChanged(selected) {
      let previousCallingCode = this.get('selected.callingCode');
      let value = this.get('value');

      if (value) {
        // swap calling codes on input
        value = value.replace(previousCallingCode, selected.callingCode);
      }

      this.set('probCountries', null);
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

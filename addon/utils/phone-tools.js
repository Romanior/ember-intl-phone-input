import { assert } from '@ember/debug';
import metadata from 'libphonenumber-js/metadata.full.json';
import { getCountryCallingCode } from 'libphonenumber-js';

import LOCAL_CODES from '../utils/localcodes';
import COUNTRIES from '../utils/countries';
import sanitizePhone from './raw-value';

const { countries: METADATA_COUNTRIES, country_calling_codes: CALLING_CODES } = metadata;
const { keys } = Object;
const OPTIONS = createOptions(COUNTRIES, METADATA_COUNTRIES, LOCAL_CODES);


export const COUNTRY_OPTIONS = OPTIONS.COUNTRY_OPTIONS;

export function searchProbableCountry(phone, countryIsoCode, config = OPTIONS, callingCodes = CALLING_CODES) {

  let plainValue = sanitizePhone(phone);
  let phoneArr = plainValue.split('');
  let probableCountry;

  for (let i = 1, len = phoneArr.length; i <= len; i++) {
    let codeToTry = phoneArr.slice(0, i).join('');
    let probCountries = callingCodes[codeToTry];

    if (probCountries && probCountries[0]) {
      probableCountry = probCountries[0];
    }

    if (plainValue && probableCountry) {
      let newCallingCode = getCountryCallingCode(probableCountry);
      let valueNoCode = plainValue.replace(newCallingCode, '');

      if (valueNoCode && probCountries) {
        let countriesToTry = keys(config.META_LOCAL_CODES).filter(function (code) {
          return probCountries.includes(code) && new RegExp(config.META_LOCAL_CODES[code]).test(valueNoCode);
        });

        if (countriesToTry[0]) {
          probableCountry = countriesToTry[0];
          break;
        }
      }
    }
  }


  return probableCountry;
}

export function findCountryObjectByIsoCode(country, countryOptions = OPTIONS.COUNTRY_OPTIONS) {
  let targetCountryObj = countryOptions.find(c => c.country === country);

  assert(
    `Country must be from the list of ISO codes: ${countryOptions.map(c => c.country).sort()}`,
    targetCountryObj
  );

  return targetCountryObj;
}


function createOptions(countries, metadata, localCodes) {
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
  return { COUNTRY_OPTIONS: countryOptions, META_LOCAL_CODES: metaLocalCodes };
}

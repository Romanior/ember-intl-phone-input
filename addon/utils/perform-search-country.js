import libphonenumber from 'npm:libphonenumber-js';
import rawValue from './raw-value';

const { getCountryCallingCode } = libphonenumber;
const { keys } = Object;

export default function(value, selectedCountry, countryOptions, guessedCountries, metaLocalCodes, callingCodes) {
  let plainValue = rawValue(value);
  let probCountries = guessedCountries || callingCodes[plainValue];
  let probCountry = (probCountries && probCountries[0]) || selectedCountry;

  if (plainValue && probCountry) {
    let newCallingCode = getCountryCallingCode(probCountry);
    let valueNoCode = plainValue.replace(newCallingCode, '');

    if (valueNoCode && probCountries) {
      let countriesToTry = keys(metaLocalCodes).filter(function(code) {
        return probCountries.includes(code) && new RegExp(metaLocalCodes[code]).test(valueNoCode);
      });

      if (countriesToTry[0]) {
        probCountry = countriesToTry[0];
      }
    }
  }

  // if only one country is the list, means it is not probable anymore
  if (!plainValue || (probCountries && probCountries.length < 2)) {
    probCountries = null;
  }

  return { probCountry, probCountries }
}

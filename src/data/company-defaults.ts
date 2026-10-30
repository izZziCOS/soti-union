/**
 * Locale-independent company facts as written in the repository. Translatable copy lives in
 * `src/i18n/translations`. Most fields can be changed in the CMS; use `company` from `./company`.
 */
export const companyDefaults = {
  name: "SOTI Union",
  legalName: "UAB „SOTI Union“",
  founded: "2008-03-18",
  address: {
    street: "Šilutės pl. 101",
    postalCode: "95112",
    city: "Klaipėda",
    countryCode: "LT",
  },
  companyCode: "301616539",
  vatCode: "LT100004500713",
  email: "info@sotiunion.com",
  marketingEmail: "marketing@sotiunion.com",
  phones: {
    director: "+370 688 78021",
    marketing: "+370 687 53334",
    careers: "+370 640 52074",
  },
};

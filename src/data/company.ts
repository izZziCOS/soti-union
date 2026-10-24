/** Locale-independent company facts. Translatable copy lives in `src/i18n/translations`. */
export const company = {
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
  maps: {
    link: "https://www.google.com/maps/search/?api=1&query=%C5%A0ilut%C4%97s+pl.+101%2C+95112+Klaip%C4%97da",
    embed:
      "https://www.google.com/maps?q=%C5%A0ilut%C4%97s+pl.+101%2C+95112+Klaip%C4%97da&z=14&output=embed",
  },
} as const;

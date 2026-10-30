import { applyCompany } from "~/cms/editable";
import { remoteContent } from "~/cms/remote";
import { defaultLocale } from "~/i18n/locales";
import { companyDefaults } from "./company-defaults";

const details = remoteContent
  ? applyCompany(companyDefaults, remoteContent[defaultLocale])
  : companyDefaults;

const mapQuery = encodeURIComponent(
  `${details.address.street}, ${details.address.postalCode} ${details.address.city}`,
);

/** Company facts, including the changes made in the CMS. */
export const company = {
  ...details,
  maps: {
    link: `https://www.google.com/maps/search/?api=1&query=${mapQuery}`,
    embed: `https://www.google.com/maps?q=${mapQuery}&z=14&output=embed`,
  },
};

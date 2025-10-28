export default {
  editor: {
    label: {
      en: "Statistics Chart",
      de: "Statistik Chart",
    },
  },
  properties: {
    userId: {
      label: {
        en: "User ID",
        de: "Benutzer ID",
      },
      type: "Number",
      defaultValue: 1,
      bindable: true,
      section: "settings",
    },
    period: {
      label: {
        en: "Period",
        de: "Zeitraum",
      },
      type: "Text",
      defaultValue: "week",
      bindable: true,
      section: "settings",
      options: {
        options: [
          { value: "day", label: "Tag" },
          { value: "week", label: "Woche" },
          { value: "month", label: "Monat" },
        ],
      },
    },
    referenceDate: {
      label: {
        en: "Reference Date (timestamp)",
        de: "Referenzdatum (timestamp)",
      },
      type: "Number",
      defaultValue: null,
      bindable: true,
      section: "settings",
    },
    showPeriodSelector: {
      label: {
        en: "Show Period Selector",
        de: "Period-Auswahl anzeigen",
      },
      type: "OnOff",
      defaultValue: true,
      bindable: true,
      section: "settings",
    },
  },
};

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import Select from "primevue/select";

const { locale } = useI18n();

const supportedLanguages = [
  "km",
  "en",
];

const unitedKingdomFlag = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    aria-hidden="true"
  >
    <rect
      x="1"
      y="4"
      width="30"
      height="24"
      rx="4"
      ry="4"
      fill="#071b65"
    />

    <path
      d="M5.101,4h-.101c-1.981,0-3.615,1.444-3.933,3.334L26.899,28h.101c1.981,0,3.615-1.444,3.933-3.334L5.101,4Z"
      fill="#fff"
    />

    <path
      d="M22.25,19h-2.5l9.934,7.947c.387-.353,.704-.777,.929-1.257l-8.363-6.691Z"
      fill="#b92932"
    />

    <path
      d="M1.387,6.309l8.363,6.691h2.5L2.316,5.053c-.387,.353-.704,.777-.929,1.257Z"
      fill="#b92932"
    />

    <path
      d="M5,28h.101L30.933,7.334c-.318-1.891-1.952-3.334-3.933-3.334h-.101L1.067,24.666c.318,1.891,1.952,3.334,3.933,3.334Z"
      fill="#fff"
    />

    <rect
      x="13"
      y="4"
      width="6"
      height="24"
      fill="#fff"
    />

    <rect
      x="1"
      y="13"
      width="30"
      height="6"
      fill="#fff"
    />

    <rect
      x="14"
      y="4"
      width="4"
      height="24"
      fill="#b92932"
    />

    <rect
      x="14"
      y="1"
      width="4"
      height="30"
      transform="translate(32) rotate(90)"
      fill="#b92932"
    />

    <path
      d="M28.222,4.21l-9.222,7.376v1.414h.75l9.943-7.94c-.419-.384-.918-.671-1.471-.85Z"
      fill="#b92932"
    />

    <path
      d="M2.328,26.957c.414,.374,.904,.656,1.447,.832l9.225-7.38v-1.408h-.75L2.328,26.957Z"
      fill="#b92932"
    />

    <path
      d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
      opacity=".15"
    />

    <path
      d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
      fill="#fff"
      opacity=".2"
    />
  </svg>
`;

const cambodiaFlag = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    aria-hidden="true"
  >
    <path
      fill="#ce2c2d"
      d="M1 8H31V24H1z"
    />

    <path
      d="M5,4H27c2.208,0,4,1.792,4,4v2H1v-2c0-2.208,1.792-4,4-4Z"
      fill="#0f299c"
    />

    <path
      d="M5,22H27c2.208,0,4,1.792,4,4v2H1v-2c0-2.208,1.792-4,4-4Z"
      transform="rotate(180 16 25)"
      fill="#0f299c"
    />

    <path
      d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
      opacity=".15"
    />

    <path
      d="M23,19.56h-.349v-.676h-.349v-.577h-.347v-.435h-.207v-.337c-1.181,.12-.041-2.08-.268-2.706-.088-.009-.162,.047-.201,.106,.061-.16-.094-.609-.184-.242h-.181v-.487c-.454,.425-.108,.088-.26-.33-.01,.067-.09,.196-.123,.185,.068-.165,.156-.285,.036-.509-.147,.466,.042-.047-.102-.253-.007,.054-.06,.209-.069,.197,.05-.796-.769-.795-.718,0-.009,.012-.062-.143-.069-.197-.143,.206,.045,.719-.102,.253-.121,.225-.033,.344,.036,.509-.033,.011-.113-.117-.123-.184-.152,.418,.194,.755-.26,.33v.852h-.219c.024-.097-.19-.093-.159,.002h-1.3l.002-.783c-.201,.078-.192,.183-.189,.307-.227,.098-.265-.318-.043-.304v-.323c-.041,.009-.158,.007-.262,.165v-.082c-.137-.012-.138,.117-.141,.367h-.036c-.098-.348,.306-.505,.096-.845-.337,.542,.262-.405-.03-.57-.267,.722,.085-.266-.144-.401-.175,.661,.045-.217-.104-.27-.232,.429,.065-.11-.094-.215-.166,.279-.063-.112-.049-.184h-.062l.022-.171h-.079l.019-.142h-.137l.013-.144h-.125c.031-.286-.322-.285-.292,0h-.125l.013,.144h-.137l.019,.142h-.079l.022,.171h-.061c.01,.067,.107,.463-.049,.184-.157,.11,.136,.646-.096,.208-.149,.101,.081,.885-.102,.277-.229,.134,.123,1.124-.144,.401-.292,.164,.307,1.112-.03,.57-.21,.341,.195,.498,.096,.845h-.017c-.001-.267,0-.377-.149-.367v.081c-.104-.156-.22-.154-.261-.164v.323c.218-.019,.188,.401-.034,.304,.006-.127,.003-.227-.197-.306v.783h-1.297c.031-.095-.183-.099-.159-.002h-.218v-.852c-.454,.425-.108,.088-.26-.33-.01,.067-.09,.196-.123,.184,.068-.165,.156-.285,.036-.509-.146,.466,.042-.047-.102-.253-.007,.054-.06,.209-.069,.197,.05-.796-.769-.795-.718,0-.009,.012-.062-.143-.069-.197-.143,.206,.045,.719-.102,.253-.121,.225-.032,.344,.036,.509-.033,.011-.113-.117-.123-.185-.152,.419,.194,.755-.26,.33v.487h-.181c-.09-.368-.245,.083-.184,.242-.039-.058-.114-.115-.201-.106-.227,.626,.914,2.824-.269,2.706v.337h-.207v.438l-.347-.003v.578h-.349v.676s-.349,0-.349,0v.724h2.493c.235,0,.683,0,.918,0h0s3.131,0,3.131,0h0c.235,0,.683,0,.918,0h0s3.125,0,3.125,0h0c.235,0,.683,0,.918,0h0s2.499,0,2.499,0v-.724Z"
      fill="#fff"
    />

    <path
      d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
      fill="#fff"
      opacity=".2"
    />
  </svg>
`;

const languageOptions = [
  {
    label: "ខ្មែរ",
    value: "km",
    flagSvg: cambodiaFlag,
  },
  {
    label: "English",
    value: "en",
    flagSvg: unitedKingdomFlag,
  },
];

/*
|--------------------------------------------------------------------------
| Set initial language
|--------------------------------------------------------------------------
|
| Use the saved language when it is valid.
| Otherwise, Khmer is selected by default.
|
*/

const savedLanguage =
  localStorage.getItem(
    "app_language"
  );

if (
  savedLanguage &&
  supportedLanguages.includes(
    savedLanguage
  )
) {
  locale.value = savedLanguage;
} else {
  locale.value = "km";

  localStorage.setItem(
    "app_language",
    "km"
  );
}

document.documentElement.lang =
  locale.value;

/*
|--------------------------------------------------------------------------
| Selected language
|--------------------------------------------------------------------------
*/

const selectedLanguage = computed({
  get() {
    return supportedLanguages.includes(
      locale.value
    )
      ? locale.value
      : "km";
  },

  set(value) {
    if (
      !supportedLanguages.includes(value)
    ) {
      return;
    }

    locale.value = value;

    localStorage.setItem(
      "app_language",
      value
    );

    document.documentElement.lang =
      value;
  },
});

const getSelectedLanguage = (
  value
) => {
  return (
    languageOptions.find(
      (language) =>
        language.value === value
    ) ||
    languageOptions[0]
  );
};
</script>

<template>
  <Select
    v-model="selectedLanguage"
    :options="languageOptions"
    optionLabel="label"
    optionValue="value"
    class="language-select w-full"
    aria-label="Select language"
    :pt="{
      root: {
        class:
          'border-gray-200 bg-white',
      },
      label: {
        class:
          'flex items-center',
      },
    }"
  >
    <!-- Selected language -->

    <template #value="slotProps">
      <div
        class="
          flex
          min-w-0
          items-center
          gap-2
        "
      >
        <span
          class="
            language-flag
            shrink-0
          "
          v-html="
            getSelectedLanguage(
              slotProps.value
            ).flagSvg
          "
        ></span>

        <span
          class="
            hidden
            truncate
            text-sm
            font-medium
            text-gray-700
            sm:block
          "
        >
          {{
            getSelectedLanguage(
              slotProps.value
            ).label
          }}
        </span>
      </div>
    </template>

    <!-- Language options -->

    <template #option="slotProps">
      <div
        class="
          flex
          items-center
          gap-3
        "
      >
        <span
          class="
            language-flag
            shrink-0
          "
          v-html="
            slotProps.option.flagSvg
          "
        ></span>

        <span
          class="
            text-sm
            font-medium
          "
        >
          {{ slotProps.option.label }}
        </span>
      </div>
    </template>
  </Select>
</template>
<style scoped>
.language-select {
  width: 60px;
  min-width: 60px;
}

:deep(.p-select-label) {
  display: flex;
  align-items: center;
  padding: 0.375rem 0.25rem;
}

:deep(.p-select-dropdown) {
  width: 1.5rem;
  min-width: 1.5rem;
}

:deep(.p-select-label svg),
:deep(.p-select-option svg) {
  display: block;
  width: 100%;
  height: 100%;
}

@media (min-width: 640px) {
  .language-select {
    width: 132px;
    min-width: 132px;
  }

  :deep(.p-select-label) {
    padding: 0.5rem 0.625rem;
  }

  :deep(.p-select-dropdown) {
    width: 2rem;
    min-width: 2rem;
  }
}
</style>
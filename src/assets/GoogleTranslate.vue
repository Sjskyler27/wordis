<template>
  <div class="google-translate-wrapper">
    <span v-if="false" class="show-hide-translate-boolean"
      >Hide: {{ hideGoogleTranslate }}</span
    >

    <div :class="[{ 'google-translate-container-hide': hideGoogleTranslate }]">
      <div
        id="google_translate_element"
        style="position: fixed; bottom: 10px; left: 10px; z-index: 0"
      ></div>
    </div>
    <!-- after we see the banner pop up we hide everything, that includes the select language so make a fake one that can re show the select language-->
    <div v-if="showFakeButton" @click="unhideLanguageButton" :class="[{ 'google-translate-container-hide': hideGoogleTranslate }]">
      <div class="fake-language-button"
      >{{showFakeButton}}</div>
    </div>

    <!-- Disclaimer -->
    <transition name="translation-disclaimer-fade">
      <div v-if="showDisclaimer" class="translate-disclaimer">
        ⚠ Game text is translated using google translate. Results may very.
      </div>
    </transition>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted, ref } from "vue";
import {
  hideGoogleTranslateIframesAfterDelay,
  hideGoogleTranslateExtras,
  unhideGoogleTranslateExtras
} from "./RemoveGoggleIFrame";

const props = defineProps({
  hideGoogleTranslate: Boolean,
  isMobile: Boolean
});
const emit = defineEmits(["language-changed"]);

const showDisclaimer = ref(false);
const currentLanguage = ref("");
const showFakeButton = ref('');

function waitForTranslateIframeIncrease(onIncrease) {
  let lastCount = document.getElementsByTagName("iframe").length;

  const check = setInterval(() => {
    const currentIframes = document.getElementsByTagName("iframe");
    const count = currentIframes.length;

    // Debug
    console.log("Iframe count:", count);
    if(props.hideGoogleTranslate) clearInterval(check); // clear the checks if you are in game!
    // If iframe count increased, trigger
    if ((count > lastCount && lastCount > 2) || count > 4) {
      console.log("Google Translate iframes detected");

      // Hide the new iframes
      for (let i = 0; i < currentIframes.length; i++) {
        const iframe = currentIframes[i];
        if (iframe.className.includes("skiptranslate")) {
          iframe.style.display = "none";
        }
      }

      // Stop checking further
      clearInterval(check);

      // Trigger callback
      if (onIncrease) onIncrease();
    }

    lastCount = count;
  }, 500); // Check every 300ms
}

const unhideLanguageButton = (() => {
  // hide the button then delay to show the iframes so you don't see the overlay 
  showFakeButton.value = '';
  // maybe deselect the element if you keep getting overlay 

  setTimeout(() => {
    unhideGoogleTranslateExtras()
  }, 300);
})

onMounted(() => {
  // Load Google Translate script dynamically
  const script = document.createElement("script");
  script.src =
    "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.head.appendChild(script);

  window.googleTranslateElementInit = function () {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: 'en,es,fr,de,it,pt,ru,ja,zh-CN,zh-TW,ko,ar,hi,id,tr,pl',
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
      },
      "google_translate_element"
    );

    // Wait for dropdown to exist before attaching events
    waitForTranslateIframeIncrease(() => {
      console.log("Language change cleanup triggered");
      setTimeout(() => {
        
        hideGoogleTranslateExtras(100);
      }, 2000);
      showFakeButton.value='ChangeLanguage'; // this gives us a way to get back to selecting a language 
      hideGoogleTranslateIframesAfterDelay(300);
      
      // show disclaimer if language is not English
      const lang = document
        .querySelector('.goog-te-combo')
        ?.value?.toLowerCase();

      if (lang !== 'en') {
        showDisclaimer.value = true;
        setTimeout(() => {
          showDisclaimer.value = false;
        }, 7000);
      }
    });
  };
});
</script>

<style lang="scss">
// note this is not scoped!
.google-translate-container-hide {
  visibility: hidden;
}

.translate-disclaimer {
  position: fixed;
  bottom: 90px;
  left: 10px;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 8px 12px;
  border: 2px solid #fff;
  border-radius: 6px;
  font-family: "Press Start 2P", cursive;
  font-size: 12px;
  max-width: 260px;
  text-align: left;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
}

.translation-disclaimer-fade-enter-active,
.translation-disclaimer-fade-leave-active {
  transition: opacity 0.4s;
}
.translation-disclaimer-fade-enter-from,
.translation-disclaimer-fade-leave-to {
  opacity: 0;
}
/* Translate container styling */
.goog-te-gadget-simple {
  background-color: transparent !important;
  border: none !important;
  color: white !important;
  font-family: "Press Start 2P", cursive !important;
  font-size: 16px !important;
  padding: 2px 4px !important;
  display: inline-flex !important;
  z-index: 2 !important;
  align-items: center;
} 
.fake-language-button{
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: transparent;
  border: none;
  color: white;
  font-family: "Press Start 2P", cursive ;
  font-size: 16px ;
  padding: 2px 4px ;
  align-items: center;
  z-index: 1;
}

/* The text part inside */
.goog-te-gadget-simple span {
  color: white !important;
  margin-right: 8px !important; /* <-- Add gap before the ▼ arrow */
}

/* Hide Google "G" icon */
.goog-te-gadget img {
  display: none !important;
}
/* Hide Google Translate divider line */
.goog-te-gadget-simple span[style*="border-left"] {
  display: none !important;
}
.google-translate-container-hide {
  visibility: hidden;
}
.google-translate-iframe-hide {
  iframe {
    display: none;
  }
}

/* Dropdown styling */
.goog-te-combo {
  background-color: rgba(0, 0, 0, 0.4) !important;
  color: white !important;
  border: 1px solid white !important;
  border-radius: 4px !important;
  font-size: 12px !important;
  padding: 2px 6px !important;
}
.show-hide-translate-boolean {
  color: white;
  font-size: 20px;
  position: fixed;
  bottom: 30px;
  left: 20px;
  z-index: 1000;
}

   @media (max-width: 1230px) {
    .goog-te-gadget-simple {
      font-size: 9px !important;
    }
    .fake-language-button{
      font-size: 9px;
      bottom: 13px;
    }

   }

// this will set the backgrounds of the extra elements invisible makeing them less obtrusive
// carefull anything you hover over gets this 
[class*="VIpgJd"], [class*="skiptranslate"] {
  display: "none" !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
</style>

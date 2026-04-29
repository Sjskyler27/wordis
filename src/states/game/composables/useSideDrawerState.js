import { ref, watch } from 'vue';

export function useSideDrawerState({
  isSideDrawerMode,
  isMobile,
  controllerRegion,
  isControllerNavigationActive
}) {
  const isSideDrawerOpen = ref(false);
  const sideDrawerAutoOpen = ref(false);

  const openSideDrawer = ({ auto = false } = {}) => {
    if (!isSideDrawerMode.value) {
      return;
    }

    isSideDrawerOpen.value = true;
    sideDrawerAutoOpen.value = auto;
  };

  const closeSideDrawer = () => {
    isSideDrawerOpen.value = false;
    sideDrawerAutoOpen.value = false;
  };

  const toggleSideDrawer = () => {
    if (isSideDrawerOpen.value) {
      closeSideDrawer();
      return;
    }

    openSideDrawer({ auto: false });
  };

  watch(isSideDrawerMode, (isDrawerMode) => {
    if (!isDrawerMode) {
      closeSideDrawer();
    }
  });

  watch([isSideDrawerMode, isMobile], ([isDrawerMode, isMobileValue]) => {
    if (isDrawerMode && isMobileValue) {
      openSideDrawer({ auto: true });
    }
  }, { immediate: true });

  //potential spasmning cursor issue
  watch(controllerRegion, (nextRegion, previousRegion) => {
    if (!isSideDrawerMode.value || !isControllerNavigationActive.value) {
      return;
    }

    if (nextRegion === 'cards') {
      openSideDrawer({ auto: true });
      return;
    }
    if (previousRegion === 'cards' && sideDrawerAutoOpen.value) {
      closeSideDrawer();
    }
  });

  return {
    isSideDrawerOpen,
    openSideDrawer,
    closeSideDrawer,
    toggleSideDrawer
  };
}

const TAB_ROOT_SELECTOR = "[data-offers-tabs]";
const TAB_TRIGGER_SELECTOR = "[data-offers-tab-trigger]";
const TAB_PANEL_SELECTOR = "[data-offers-tab-panel]";

export function createOffersTabs(root = document) {
  let currentRoot = root?.querySelectorAll ? root : document;
  let isInitialized = false;

  const getTabRoots = () => currentRoot.querySelectorAll(TAB_ROOT_SELECTOR);

  const setActiveTab = (tabRoot, tabName) => {
    const triggers = tabRoot.querySelectorAll(TAB_TRIGGER_SELECTOR);
    const panels = tabRoot.querySelectorAll(TAB_PANEL_SELECTOR);

    for (const trigger of triggers) {
      const isActive = trigger.getAttribute("data-offers-tab-trigger") === tabName;
      trigger.setAttribute("aria-selected", String(isActive));
      trigger.classList.toggle("is-active", isActive);
    }

    for (const panel of panels) {
      const isActive = panel.getAttribute("data-offers-tab-panel") === tabName;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
    }

    tabRoot.setAttribute("data-offers-tab-active", tabName);
  };

  const initTabRoot = (tabRoot) => {
    const firstTrigger = tabRoot.querySelector(TAB_TRIGGER_SELECTOR);
    if (!firstTrigger) {
      return;
    }

    const initialTab =
      tabRoot.getAttribute("data-offers-tab-active") ||
      firstTrigger.getAttribute("data-offers-tab-trigger");

    if (initialTab) {
      setActiveTab(tabRoot, initialTab);
    }
  };

  const handleClick = (event) => {
    const trigger = event.target.closest(TAB_TRIGGER_SELECTOR);
    if (!trigger || !currentRoot.contains(trigger)) {
      return;
    }

    const tabRoot = trigger.closest(TAB_ROOT_SELECTOR);
    const tabName = trigger.getAttribute("data-offers-tab-trigger");
    if (!tabRoot || !tabName) {
      return;
    }

    event.preventDefault();
    setActiveTab(tabRoot, tabName);
  };

  const init = (nextRoot = currentRoot) => {
    currentRoot = nextRoot?.querySelectorAll ? nextRoot : document;

    for (const tabRoot of getTabRoots()) {
      initTabRoot(tabRoot);
    }

    if (isInitialized) {
      return;
    }

    currentRoot.addEventListener("click", handleClick);
    isInitialized = true;
  };

  const destroy = () => {
    if (!isInitialized) {
      return;
    }

    currentRoot.removeEventListener("click", handleClick);
    isInitialized = false;
  };

  return {
    init,
    destroy,
  };
}

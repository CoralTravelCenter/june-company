import {FEATURE_CARD_SELECTOR, MOBILE_MEDIA} from "./constants.js";

export function createFeatureCardsObserver(root = document) {
  let featureCardsObserver = null;
  let currentRoot = root?.querySelectorAll ? root : document;
  const mobileMediaQuery = window.matchMedia(MOBILE_MEDIA);

  const disconnect = () => {
    if (featureCardsObserver) {
      featureCardsObserver.disconnect();
      featureCardsObserver = null;
    }
  };

  const sync = () => {
    const cards = currentRoot.querySelectorAll(FEATURE_CARD_SELECTOR);

    if (!mobileMediaQuery.matches) {
      disconnect();
      cards.forEach((card) => card.classList.remove("feature-card--in-view"));
      return;
    }

    disconnect();

    featureCardsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("feature-card--in-view", entry.isIntersecting);
        });
      },
      {
        threshold: 0.7,
      }
    );

    cards.forEach((card) => featureCardsObserver.observe(card));
  };

  const init = (nextRoot = currentRoot) => {
    currentRoot = nextRoot?.querySelectorAll ? nextRoot : document;
    sync();
    mobileMediaQuery.addEventListener("change", sync);
  };

  const destroy = () => {
    disconnect();
    mobileMediaQuery.removeEventListener("change", sync);
  };

  return {
    init,
    destroy,
    sync,
  };
}

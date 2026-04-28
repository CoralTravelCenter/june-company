import {hostReactAppReady, vimeoAutoPlay} from "../utils/utils.js";
import {createWelcomeAnalytics} from "./welcome-modules/analytics.js";
import {createContentRouter} from "./welcome-modules/contentRouter.js";
import {createFeatureCardsObserver} from "./welcome-modules/featureCardsObserver.js";
import {createOffersTabs} from "./welcome-modules/offersTabs.js";
import {setSegmentCookie} from "./welcome-modules/segmentCookie.js";

export default async function initContentRouter(root = document) {
  await hostReactAppReady();

  if (window.routeContentSwitcher?.destroy) {
    window.routeContentSwitcher.destroy();
  }

  const currentRoot = root?.querySelectorAll ? root : document;
  const analytics = createWelcomeAnalytics(currentRoot);
  const contentRouter = createContentRouter(currentRoot, {
    onRouteShow(route) {
      setSegmentCookie(route);
      analytics.handleRouteShow(route);
    },
  });
  const featureCardsObserver = createFeatureCardsObserver(currentRoot);
  const offersTabs = createOffersTabs(currentRoot);

  const init = (nextRoot = currentRoot) => {
    analytics.init(nextRoot);
    contentRouter.init(nextRoot);
    featureCardsObserver.init(nextRoot);
    offersTabs.init(nextRoot);
  };

  const destroy = () => {
    analytics.destroy();
    offersTabs.destroy();
    featureCardsObserver.destroy();
    contentRouter.destroy();
  };

  init(root);

  window.routeContentSwitcher = {
    init,
    destroy,
    render: contentRouter.render,
    setRoute: contentRouter.setRoute,
    getCurrentRoute: contentRouter.getCurrentRoute,
  };

  await vimeoAutoPlay();
}

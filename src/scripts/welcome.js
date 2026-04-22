import {hostReactAppReady, vimeoAutoPlay} from "../utils/utils.js";
import {createContentRouter} from "./welcome-modules/contentRouter.js";
import {createFeatureCardsObserver} from "./welcome-modules/featureCardsObserver.js";
import {createOffersTabs} from "./welcome-modules/offersTabs.js";

export default async function initContentRouter(root = document) {
  if (window.routeContentSwitcher?.destroy) {
    window.routeContentSwitcher.destroy();
  }

  await hostReactAppReady();

  const currentRoot = root?.querySelectorAll ? root : document;
  const contentRouter = createContentRouter(currentRoot);
  const featureCardsObserver = createFeatureCardsObserver(currentRoot);
  const offersTabs = createOffersTabs(currentRoot);

  const init = (nextRoot = currentRoot) => {
    contentRouter.init(nextRoot);
    featureCardsObserver.init(nextRoot);
    offersTabs.init(nextRoot);
  };

  const destroy = () => {
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

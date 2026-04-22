import {
  CONTAINER_SELECTOR,
  DEFAULT_ROUTE,
  ITEM_SELECTOR,
  PARAM_NAME,
  STATE_KEY,
  TRIGGER_SELECTOR,
} from "./constants.js";

export function createContentRouter(root = document) {
  let isInitialized = false;
  let currentRoot = root?.querySelectorAll ? root : document;

  const getUrl = () => new URL(window.location.href);

  const getCurrentRoute = () => getUrl().searchParams.get(PARAM_NAME) || DEFAULT_ROUTE;

  const getContainers = () => currentRoot.querySelectorAll(CONTAINER_SELECTOR);

  const createState = (route) => ({
    [STATE_KEY]: true,
    route,
  });

  const getRenderableRoute = (items, requestedRoute) => {
    for (const item of items) {
      if (item.getAttribute("data-route-content") === requestedRoute) {
        return requestedRoute;
      }
    }

    return DEFAULT_ROUTE;
  };

  const syncHistoryState = () => {
    const url = getUrl();
    const route = getCurrentRoute();

    if (!url.searchParams.has(PARAM_NAME)) {
      url.searchParams.set(PARAM_NAME, route);
    }

    if (!history.state || history.state[STATE_KEY] !== true || history.state.route !== route) {
      history.replaceState(createState(route), "", url.toString());
    }
  };

  const render = () => {
    const requestedRoute = getCurrentRoute();

    for (const container of getContainers()) {
      const items = Array.from(container.querySelectorAll(ITEM_SELECTOR));
      const activeRoute = getRenderableRoute(items, requestedRoute);

      for (const item of items) {
        item.hidden = item.getAttribute("data-route-content") !== activeRoute;
      }

      container.setAttribute("data-route-active", activeRoute);
    }
  };

  const setRoute = (route, {replace = false} = {}) => {
    if (!route || route === getCurrentRoute()) {
      return;
    }

    const url = getUrl();
    url.searchParams.set(PARAM_NAME, route);

    history[replace ? "replaceState" : "pushState"](createState(route), "", url.toString());
    render();
  };

  const handleClick = (event) => {
    const trigger = event.target.closest(TRIGGER_SELECTOR);
    if (!trigger || !currentRoot.contains(trigger)) {
      return;
    }

    const route = trigger.getAttribute("data-route-switch");
    if (!route) {
      return;
    }

    event.preventDefault();
    setRoute(route);
  };

  const handlePopState = () => {
    render();
  };

  const destroy = () => {
    if (!isInitialized) {
      return;
    }

    currentRoot.removeEventListener("click", handleClick);
    window.removeEventListener("popstate", handlePopState);
    isInitialized = false;
  };

  const init = (nextRoot = currentRoot) => {
    if (isInitialized) {
      return;
    }

    currentRoot = nextRoot?.querySelectorAll ? nextRoot : document;
    syncHistoryState();
    render();

    currentRoot.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);
    isInitialized = true;
  };

  return {
    init,
    destroy,
    render,
    setRoute,
    getCurrentRoute,
  };
}

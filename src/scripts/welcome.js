export default function initContentRouter() {

  const PARAM_NAME = 'utm_source';
  const DEFAULT_ROUTE = 'default';
  const CONTAINER_SELECTOR = '[data-router-content]';
  const ITEM_SELECTOR = '[data-route-content]';

  function getUrl() {
    return new URL(window.location.href);
  }

  function ensureRouteParam() {
    const url = getUrl();

    if (!url.searchParams.get(PARAM_NAME)) {
      url.searchParams.set(PARAM_NAME, DEFAULT_ROUTE);
      history.replaceState({}, '', url.toString());
    }
  }

  function getCurrentRoute() {
    const url = getUrl();
    return url.searchParams.get(PARAM_NAME) || DEFAULT_ROUTE;
  }

  function setRoute(route, {replace = false} = {}) {
    const url = getUrl();
    url.searchParams.set(PARAM_NAME, route);

    if (replace) {
      history.replaceState({}, '', url.toString());
    } else {
      history.pushState({}, '', url.toString());
    }

    render();
  }

  function render() {
    const container = document.querySelector(CONTAINER_SELECTOR);
    if (!container) return;

    const currentRoute = getCurrentRoute();
    const items = container.querySelectorAll(ITEM_SELECTOR);

    let matched = false;

    items.forEach(item => {
      const route = item.getAttribute('data-route-content');
      const isActive = route === currentRoute;

      item.hidden = !isActive;

      if (isActive) {
        matched = true;
      }
    });

    if (!matched) {
      items.forEach(item => {
        const isDefault = item.getAttribute('data-route-content') === DEFAULT_ROUTE;
        item.hidden = !isDefault;
      });
    }

    container.setAttribute('data-route-active', matched ? currentRoute : DEFAULT_ROUTE);
  }

  function handleClick(event) {
    const trigger = event.target.closest('[data-route-switch]');
    if (!trigger) return;

    event.preventDefault();

    const route = trigger.getAttribute('data-route-switch');
    if (!route) return;

    setRoute(route);
  }

  function init() {
    ensureRouteParam();
    render();

    window.addEventListener('popstate', render);
    document.addEventListener('click', handleClick);
  }

  init();

  window.routeContentSwitcher = {
    setRoute,
    render,
    getCurrentRoute
  };
}

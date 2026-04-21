export default function initContentRouter() {
	const PARAM_NAME = "utm_term";
	const DEFAULT_ROUTE = "false";
	const CONTAINER_SELECTOR = "[data-router-content]";
	const ITEM_SELECTOR = "[data-route-content]";
	const TRIGGER_SELECTOR = "[data-route-switch]";
	const STATE_KEY = "__contentRouter";

	if (window.routeContentSwitcher?.destroy) {
		window.routeContentSwitcher.destroy();
	}

	let isInitialized = false;

	function getUrl() {
		return new URL(window.location.href);
	}

	function getCurrentRoute() {
		const url = getUrl();
		return url.searchParams.get(PARAM_NAME) || DEFAULT_ROUTE;
	}

	function getContainers() {
		return document.querySelectorAll(CONTAINER_SELECTOR);
	}

	function buildState(route) {
		return {
			[STATE_KEY]: true,
			route,
		};
	}

	function ensureRouteParam() {
		const url = getUrl();
		const currentRoute = url.searchParams.get(PARAM_NAME) || DEFAULT_ROUTE;

		if (!url.searchParams.get(PARAM_NAME)) {
			url.searchParams.set(PARAM_NAME, currentRoute);
			history.replaceState(buildState(currentRoute), "", url.toString());
			return;
		}

		if (!history.state || history.state[STATE_KEY] !== true) {
			history.replaceState(buildState(currentRoute), "", url.toString());
		}
	}

	function render() {
		const containers = getContainers();
		if (!containers.length) return;

		const currentRoute = getCurrentRoute();

		containers.forEach((container) => {
			const items = container.querySelectorAll(ITEM_SELECTOR);
			let matched = false;

			items.forEach((item) => {
				const route = item.getAttribute("data-route-content");
				const isActive = route === currentRoute;

				item.hidden = !isActive;

				if (isActive) {
					matched = true;
				}
			});

			if (!matched) {
				items.forEach((item) => {
					const isDefault = item.getAttribute("data-route-content") === DEFAULT_ROUTE;
					item.hidden = !isDefault;
				});
			}

			container.setAttribute("data-route-active", matched ? currentRoute : DEFAULT_ROUTE);
		});
	}

	function setRoute(route, { replace = false } = {}) {
		if (!route) return;

		const currentRoute = getCurrentRoute();
		if (route === currentRoute) return;

		const url = getUrl();
		url.searchParams.set(PARAM_NAME, route);

		const method = replace ? "replaceState" : "pushState";
		history[method](buildState(route), "", url.toString());

		console.log("[content-router] setRoute", {
			route,
			replace,
			url: url.toString(),
			state: history.state,
		});

		render();
	}

	function handleClick(event) {
		const trigger = event.target.closest(TRIGGER_SELECTOR);
		if (!trigger) return;

		event.preventDefault();

		const route = trigger.getAttribute("data-route-switch");
		if (!route) return;

		setRoute(route);
	}

	function handlePopState(event) {
		console.log("[content-router] popstate", {
			state: event.state,
			url: window.location.href,
		});

		render();
	}

	function handleBeforeUnload() {
		console.log("[content-router] beforeunload", {
			url: window.location.href,
		});
	}

	function handlePageShow(event) {
		console.log("[content-router] pageshow", {
			persisted: event.persisted,
			url: window.location.href,
			state: history.state,
		});
	}

	function destroy() {
		if (!isInitialized) return;

		document.removeEventListener("click", handleClick);
		window.removeEventListener("popstate", handlePopState);
		window.removeEventListener("beforeunload", handleBeforeUnload);
		window.removeEventListener("pageshow", handlePageShow);

		isInitialized = false;
	}

	function init() {
		if (isInitialized) return;

		isInitialized = true;

		ensureRouteParam();
		render();

		document.addEventListener("click", handleClick);
		window.addEventListener("popstate", handlePopState);
		window.addEventListener("beforeunload", handleBeforeUnload);
		window.addEventListener("pageshow", handlePageShow);
	}

	init();

	window.routeContentSwitcher = {
		init,
		destroy,
		render,
		setRoute,
		getCurrentRoute,
	};
}

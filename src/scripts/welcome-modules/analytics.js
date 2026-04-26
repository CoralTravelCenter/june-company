import {ITEM_SELECTOR, TRIGGER_SELECTOR} from "./constants.js";

const YM_COUNTER_ID = 96674199;
const SEGMENTS = new Set(["solo", "family", "couple"]);
const HOTEL_BLOCK_SELECTOR = ".offers-tabs";
const BENEFIT_SELECTOR = ".feature-card";
const BENEFIT_MIN_READ_TIME = 1000;

function getSegment(route) {
  return SEGMENTS.has(route) ? route : null;
}

function reachGoal(name, params) {
  if (typeof window.ym !== "function") return;

  try {
    if (params) {
      window.ym(YM_COUNTER_ID, "reachGoal", name, params);
    } else {
      window.ym(YM_COUNTER_ID, "reachGoal", name);
    }
  } catch (error) {
    console.warn("[analytics] ym goal failed:", error);
  }
}

function getBenefitName(card) {
  const className = Array.from(card.classList).find((name) => name.startsWith("feature-card--"));
  return className ? className.replace("feature-card--", "") : "unknown";
}

function getCardSegment(card) {
  return getSegment(card.closest(ITEM_SELECTOR)?.getAttribute("data-route-content"));
}

function getNow() {
  return Math.round(performance.now());
}

export function createWelcomeAnalytics(root = document) {
  let currentRoot = root?.querySelectorAll ? root : document;
  let activeSegment = null;
  let hotelObserver = null;
  let isInitialized = false;

  const shownLandingSegments = new Set();
  const shownHotelSegments = new Set();
  const activeBenefitTimers = new Map();

  let segmentPageShown = false;

  const stopHotelObserver = () => {
    hotelObserver?.disconnect();
    hotelObserver = null;
  };

  const sendSegmentPageShow = () => {
    if (segmentPageShown) return;
    reachGoal("june_26_segment_page_show");
    segmentPageShown = true;
  };

  const sendLandingPageShow = (segment) => {
    if (shownLandingSegments.has(segment)) return;
    reachGoal("june_26_landing_page", {segment});
    shownLandingSegments.add(segment);
  };

  const sendHotelBlockShow = (segment) => {
    if (shownHotelSegments.has(segment)) return;
    reachGoal("june_26_hotel_block_show", {segment});
    shownHotelSegments.add(segment);
  };

  const startBenefitTimer = (card) => {
    const segment = getCardSegment(card);
    if (!segment || segment !== activeSegment || activeBenefitTimers.has(card)) return;
    activeBenefitTimers.set(card, getNow());
  };

  const stopBenefitTimer = (card) => {
    const startedAt = activeBenefitTimers.get(card);
    if (!startedAt) return;

    activeBenefitTimers.delete(card);

    const segment = getCardSegment(card);
    if (!segment) return;

    const readTime = getNow() - startedAt;
    if (readTime < BENEFIT_MIN_READ_TIME) return;

    reachGoal("june_26_benefit", {
      name_segment: {
        [segment]: {
          [getBenefitName(card)]: Math.round(readTime / 1000),
        },
      },
    });
  };

  const stopAllBenefitTimers = () => {
    for (const card of activeBenefitTimers.keys()) {
      stopBenefitTimer(card);
    }
  };

  const observeHotelBlock = (segment) => {
    stopHotelObserver();
    if (!segment || shownHotelSegments.has(segment)) return;

    const routeRoot = currentRoot.querySelector(`[data-route-content="${segment}"]`);
    const hotelBlock = routeRoot?.querySelector(HOTEL_BLOCK_SELECTOR);
    if (!hotelBlock) return;

    hotelObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          sendHotelBlockShow(segment);
          stopHotelObserver();
        }
      },
      {threshold: 0.35}
    );

    hotelObserver.observe(hotelBlock);
  };

  const handleRouteShow = (route) => {
    const segment = getSegment(route);
    activeSegment = segment;
    stopAllBenefitTimers();

    if (!segment) {
      sendSegmentPageShow();
      stopHotelObserver();
      return;
    }

    sendLandingPageShow(segment);
    observeHotelBlock(segment);
  };

  const handleClick = (event) => {
    const trigger = event.target.closest(TRIGGER_SELECTOR);
    if (!trigger || !currentRoot.contains(trigger)) return;

    const segment = getSegment(trigger.getAttribute("data-route-switch"));
    if (!segment) return;

    reachGoal("june_26_segment_page", {segment});
  };

  const handlePointerOver = (event) => {
    const card = event.target.closest?.(BENEFIT_SELECTOR);
    if (!card || !currentRoot.contains(card) || card.contains(event.relatedTarget)) return;
    startBenefitTimer(card);
  };

  const handlePointerOut = (event) => {
    const card = event.target.closest?.(BENEFIT_SELECTOR);
    if (!card || card.contains(event.relatedTarget)) return;
    stopBenefitTimer(card);
  };

  const handleFocusIn = (event) => {
    const card = event.target.closest?.(BENEFIT_SELECTOR);
    if (card && currentRoot.contains(card)) startBenefitTimer(card);
  };

  const handleFocusOut = (event) => {
    const card = event.target.closest?.(BENEFIT_SELECTOR);
    if (!card || card.contains(event.relatedTarget)) return;
    stopBenefitTimer(card);
  };

  const init = (nextRoot = currentRoot) => {
    if (isInitialized) return;

    currentRoot = nextRoot?.querySelectorAll ? nextRoot : document;
    currentRoot.addEventListener("click", handleClick);
    currentRoot.addEventListener("pointerover", handlePointerOver);
    currentRoot.addEventListener("pointerout", handlePointerOut);
    currentRoot.addEventListener("focusin", handleFocusIn);
    currentRoot.addEventListener("focusout", handleFocusOut);
    window.addEventListener("pagehide", stopAllBenefitTimers);
    isInitialized = true;
  };

  const destroy = () => {
    if (!isInitialized) return;

    stopAllBenefitTimers();
    stopHotelObserver();
    currentRoot.removeEventListener("click", handleClick);
    currentRoot.removeEventListener("pointerover", handlePointerOver);
    currentRoot.removeEventListener("pointerout", handlePointerOut);
    currentRoot.removeEventListener("focusin", handleFocusIn);
    currentRoot.removeEventListener("focusout", handleFocusOut);
    window.removeEventListener("pagehide", stopAllBenefitTimers);
    isInitialized = false;
  };

  return {
    init,
    destroy,
    handleRouteShow,
  };
}

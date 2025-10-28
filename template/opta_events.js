function postEvent(event, data) {
  const handler = window.optaEventHandler;
  if (handler && typeof handler.postMessage === "function") {
    let json = {
      event: event,
      data: data,
    };
    handler.postMessage(JSON.stringify(json));
    return;
  }
  console.warn("optaEventHandler.postMessage is unavailable", event);
}

// wait until Opta is ready
function subscribeToOptaEvents(attempts) {
  attempts = attempts || 0;
  if (
    window.Opta &&
    Opta.events &&
    typeof Opta.events.subscribe === "function"
  ) {
    Opta.events.subscribe("application.init", function () {
      initAdsManager();
      postEvent("application.init");
    });
    Opta.events.subscribe("application.error", function () {
      postEvent("application.error");
      hideMuteButton(true);
    });
    Opta.events.subscribe("widget.loaded", function () {
      postEvent("widget.loaded");
    });
    Opta.events.subscribe("widget.error", function () {
      postEvent("widget.error");
      hideMuteButton(true);
    });
    postEvent("__opta_subscribed__");
    return;
  }
  if (attempts < 50) {
    // ~5s if 100ms interval
    setTimeout(function () {
      subscribeToOptaEvents(attempts + 1);
    }, 100);
  } else {
    postEvent("__opta_subscribe_timeout__");
  }
}

// JS error wiring -> stringified payloads
window.onerror = function (message, source, lineno, colno, error) {
  if (message.contains("Cannot read properties of undefined")) {
    postEvent("widget.error");
    hideMuteButton(true);
  }
};

window.addEventListener("load", () => subscribeToOptaEvents());

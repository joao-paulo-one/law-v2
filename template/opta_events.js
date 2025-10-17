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
    });
    Opta.events.subscribe("widget.loaded", function () {
      postEvent("widget.loaded");
    });
    Opta.events.subscribe("widget.error", function () {
      postEvent("widget.error");
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
  if (window.errorHandler && window.errorHandler.postMessage) {
    window.errorHandler.postMessage(
      JSON.stringify({
        type: "window.onerror",
        message: String(message),
        source: String(source),
        line: Number(lineno),
        column: Number(colno),
        stack: error && error.stack ? String(error.stack) : null,
      })
    );
  }
};

window.addEventListener("load", () => subscribeToOptaEvents());

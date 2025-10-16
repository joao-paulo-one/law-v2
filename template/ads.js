let adsManager;
let adsLoader;
let adDisplayContainer;
let muteButton;
let adsInitialized;
let adCurrentStatus;
let didRequestToPlay;
let adMuted = false;

/**
 * Initializes IMA setup.
 */
function initAdsManager() {
  setUpIMA();
  requestAd();
  createMuteButton();
}

function setAdVisibility(isVisible) {
  if (isVisible) {
    playAd();
  } else {
    pauseAd();
  }
}

function playAd() {
  console.log("playAd adStatus: " + adCurrentStatus);

  if (adCurrentStatus == undefined) {
    // listen to the event LOADED and call this func again
    didRequestToPlay = true;
  } else if (adCurrentStatus == google.ima.AdEvent.Type.LOADED) {
    adsManager.start();
    hideMuteButton(false);
  } else {
    adsManager.resume();
  }
}

function pauseAd() {
  adsManager.pause();
}

function toggleAdMute() {
  adMuted = !adMuted;
  updateMuteButtonIcon(adMuted);

  if (!adsManager) {
    return;
  }

  adsManager.setVolume(adMuted ? 0 : 1);
}

/**
 * Sets up IMA ad display container, ads loader, and makes an ad request.
 */
function setUpIMA() {
  // Create the ad display container.
  createAdDisplayContainer();
  // Create ads loader.
  adsLoader = new google.ima.AdsLoader(adDisplayContainer);
  // Listen and respond to ads loaded and error events.
  adsLoader.addEventListener(
    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
    onAdsManagerLoaded,
    false
  );
  adsLoader.addEventListener(
    google.ima.AdErrorEvent.Type.AD_ERROR,
    onAdError,
    false
  );
}

/**
 * Builds an ad request and uses it to request ads.
 */
function requestAd() {
  // Request video ads.
  const adsRequest = new google.ima.AdsRequest();

  adsRequest.adTagUrl = adTagUrl;

  adsRequest.setAdWillAutoPlay(true);
  adsRequest.setAdWillPlayMuted(adMuted);
  adsLoader.requestAds(adsRequest);
}

function createMuteButton() {
  muteButton = document.getElementById("muteButton");
}

/**
 * Sets the 'adContainer' div as the IMA ad display container.
 */
function createAdDisplayContainer() {
  // We assume the adContainer is the DOM id
  // of the element that will house the ads.
  adDisplayContainer = new google.ima.AdDisplayContainer(
    document.getElementById("adContainer")
  );
}

/**
 * Loads and initializes IMA ad playback.
 */
function startAdsManager() {
  try {
    if (!adsInitialized) {
      adDisplayContainer.initialize();
      adsInitialized = true;
    }
    const { width, height } = getAdDimensions();
    // Initialize the ads manager. Ad rules playlist will start at this time.
    adsManager.init(width, height);
  } catch (adError) {
    // TODO: Handle ad error
  }
}

/**
 * Handles the ad manager loading and sets ad event listeners.
 * @param {!google.ima.AdsManagerLoadedEvent} adsManagerLoadedEvent
 */
function onAdsManagerLoaded(adsManagerLoadedEvent) {
  // Get the ads manager.
  adsManager = adsManagerLoadedEvent.getAdsManager();

  // TODO: setup with volume with button and FF
  adsManager.setVolume(adMuted ? 0 : 1);
  updateMuteButtonIcon(adMuted);

  // Add listeners to the required events.
  adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);

  // Listen to any additional events, if necessary.
  adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.PAUSED, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.RESUMED, onAdEvent);

  startAdsManager();
}

/**
 * Handles actions taken in response to ad events.
 * @param {!google.ima.AdEvent} adEvent
 */
function onAdEvent(adEvent) {
  console.log("AdEvent: " + adEvent.type);
  adCurrentStatus = adEvent.type;
  if (adEvent.type == google.ima.AdEvent.Type.LOADED) {
    postEvent("ad.loaded");
    if (didRequestToPlay) {
      playAd();
    }
  }
  if (adEvent.type == google.ima.AdEvent.Type.COMPLETE) {
    hideMuteButton(true);
  }
}

/**
 * Handles ad errors.
 * @param {!google.ima.AdErrorEvent} adErrorEvent
 */
function onAdError(adErrorEvent) {
  postEvent("ad.error");
  adsManager.destroy();
  hideMuteButton(true);
}

function getAdDimensions() {
  const adContainerElement = document.getElementById("adContainer");
  let width = 360;
  let height = 240;

  if (adContainerElement) {
    const rect = adContainerElement.getBoundingClientRect();
    width = Math.round(rect.width) || width;
  }

  const computedHeight = Math.round(width * (9 / 16));
  if (computedHeight) {
    height = computedHeight;
  }

  console.log(`Ad dimensions: ${width}x${height}`);
  return { width, height };
}

function updateMuteButtonIcon(isMuted) {
  const next = muteButton.getAttribute("aria-pressed") !== "true";
  muteButton.setAttribute("aria-pressed", String(next));
}

function hideMuteButton(isHidden) {
  console.log("hideMuteButton: " + isHidden);
  muteButton.style.display = isHidden ? "none" : "block";
}

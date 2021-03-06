const Promise = require('bluebird');
const download = require('downloadjs');
require('animated-ellipsis');

const io = require('socket.io-client');
const socket = io();

const screensaver = require('./_screensaver');
const video = require('./_video');
const audio = require('./_audio');

const $statusWrap = $('#status-wrap');
const $listeningStatus = $('#listening');
const $processingStatus = $('#processing');
const $userText = $('#user-text');
const $messageText = $('#message-text');
const $inProgress = $('#in-progress');

const $generatingTextSection = $('#user-text .generating');
const $userGeneratingText = $('#user-text .generating-text');
const $speakingTextSection = $('#user-text .speaking');
const $userSpeakingText = $('#user-text .speaking-text');

const $cameraRoot = $('#camera-root');
let $cameraCanvas;

let screensaverTimeout = null;
let screensaverTimeoutLength = 2.5 * 60 * 1000; // ms

function setupAnimateEllipsis() {
  document.querySelectorAll('.ae').animateEllipsis();
}

function playFromUrl(url) {
  const sound = new Audio(url);
  sound.play();
}

function setupSpacebarRecord() {
  $(window).on('keydown', function(e) {
    if (e.keyCode === 32) {
      // spacebar!
      audio.startListening();
    }
  });
}

function setupArduinoButtonRecord() {
  socket.on('new_msg', function(data) {
    switch (data.msg) {
      case 'press':
        console.log('button press');

        if (screensaver.isActivated() !== true) {
          audio.startListening(); // else start recording
          console.log('screensaver not activated, listening');
        }

        keepAlive();

        break;
      default:
        console.log('unknown message from arduino:', data.msg);
        break;
    }
  });
}

// prevent screensaver on every user action
function setupActivityWake() {
  $(window).on('keydown mousemove mousedown', function(e) {
    keepAlive();
  });
}

// stave off screensaver
function keepAlive() {
  console.log('keepalive');
  if (screensaver.isActivated()) {
    wakeUp();
  }

  clearTimeout(screensaverTimeout);
  screensaverTimeout = setTimeout(goToSleep, screensaverTimeoutLength);
}

// start screensaver, reset everything
function goToSleep() {
  screensaver.start();
  video.setFramesPerCheck(false);
}

function wakeUp() {
  screensaver.stop();
  video.setFramesPerCheck(true);
}

let count = 0;
function takeScreenshot() {
  return new Promise((resolve, reject) => {
    try {
      const frame = captureVideoFrame('face_video', 'png');
      resolve(frame);
    } catch (e) {
      reject(e);
    }
  });
}

function startProgress() {
  $inProgress.css('visibility', 'visible');
  // NProgress.start();
  // return;
}

function endProgress() {
  $inProgress.css('visibility', 'hidden');
  // NProgress.done();
  // return;
}

function showListeningStatus() {
  showStatusSection();
  $('.status').hide();
  $listeningStatus.show();
}

function showProcessingStatus() {
  showStatusSection();
  $('.status').hide();
  $processingStatus.show();
}

function setUserSpeakingText(text) {
  showStatusSection();
  $('.status').hide();
  $userSpeakingText.text(text);
  $userGeneratingText.text('');
  $generatingTextSection.hide();
  $speakingTextSection.show();
  $userText.show();
}

function setUserGeneratingText(text) {
  showStatusSection();
  $('.status').hide();
  $userGeneratingText.text(text);
  $userSpeakingText.text('');
  $speakingTextSection.hide();
  $generatingTextSection.show();
  $userText.show();
}

function setMessageText(text) {
  showStatusSection();
  $('.status').hide();
  $messageText.text(text);
  $messageText.show();
}

function hideStatusSection() {
  $statusWrap.hide();
}

function showStatusSection() {
  $statusWrap.show();
}

function asyncInit() {
  return new Promise((resolve, reject) => {
    try {
      setupActivityWake();
      setupAnimateEllipsis();
      video
        .asyncSetupCamera($cameraRoot)
        .then(video.startWatching)
        .then(keepAlive)
        .then(resolve)
        .catch(e => {
          reject(e);
        });
    } catch (e) {
      reject(e);
    }
  });
}

exports.keepAlive = keepAlive;
exports.asyncInit = asyncInit;
exports.startProgress = startProgress;
exports.endProgress = endProgress;
exports.takeScreenshot = takeScreenshot;
exports.setupSpacebarRecord = setupSpacebarRecord;
exports.setupArduinoButtonRecord = setupArduinoButtonRecord;
exports.showListeningStatus = showListeningStatus;
exports.showProcessingStatus = showProcessingStatus;
exports.setMessageText = setMessageText;
exports.hideStatusSection = hideStatusSection;
exports.showStatusSection = showStatusSection;
exports.setUserSpeakingText = setUserSpeakingText;
exports.setUserGeneratingText = setUserGeneratingText;

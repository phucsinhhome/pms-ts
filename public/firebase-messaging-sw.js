/* eslint-disable no-undef */
// Receives order alerts while the PMS tab is in the background or closed. Pushes carry a
// notification payload with fcm_options.link, so the SDK shows them and opens the link on tap.
// Keep the SDK version in step with the "firebase" package and the config in step with
// firebaseConfig in src/db/configs.ts (a service worker can't import from the app bundle).
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBKvyANzUnHjRnV5rkdAoWSwBdO1twrWzY",
  authDomain: "splendid-sonar-174914.firebaseapp.com",
  projectId: "splendid-sonar-174914",
  storageBucket: "splendid-sonar-174914.firebasestorage.app",
  messagingSenderId: "523563262000",
  appId: "1:523563262000:web:93f803b191f7a62acbcdf5"
});

firebase.messaging();

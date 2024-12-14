import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <div>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <App />
  </div>
);
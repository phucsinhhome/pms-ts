import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";

ReactDOM
  .createRoot(document.getElementById('root')!)
  .render(
    <BrowserRouter>
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
      <App />
    </BrowserRouter>
  );
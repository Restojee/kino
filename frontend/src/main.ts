import "./style.css";
import { AppRoot } from "./components/app-root/app-root.view";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  new AppRoot().mount(app);
}

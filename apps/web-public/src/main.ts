import { applyStage1DiscoverAction, createStage1MobileAppState, navigateStage1App, renderStage1MobileShell } from "./stage1/mobile-shell-navigation";
import { STAGE1_SEED_FIXTURES } from "./stage1/seed-fixtures";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Missing #app mount point");
}

let state = createStage1MobileAppState(STAGE1_SEED_FIXTURES, window.location.pathname);

function render(): void {
  root.innerHTML = renderStage1MobileShell(STAGE1_SEED_FIXTURES, state);
}

function navigate(pathname: string): void {
  state = navigateStage1App(state, pathname);
  render();
}

window.addEventListener("popstate", () => {
  navigate(window.location.pathname);
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const routeLink = target.closest<HTMLAnchorElement>("a[data-stage1-route]");
  if (routeLink) {
    const pathname = routeLink.getAttribute("href");
    if (pathname) {
      event.preventDefault();
      window.history.pushState({}, "", pathname);
      navigate(pathname);
    }
    return;
  }

  const actionButton = target.closest<HTMLButtonElement>("button[data-action]");
  const action = actionButton?.dataset.action;
  if (action === "pass" || action === "like") {
    state = applyStage1DiscoverAction(STAGE1_SEED_FIXTURES, state, action);
    render();
  }
});

render();

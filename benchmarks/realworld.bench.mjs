import {
  buildPageDocument,
  runNavigationBenchmark,
  runRenderBenchmark,
  runRerenderBenchmark
} from "./runtime-harness.mjs";

export function scenarios() {
  return [
    runRenderBenchmark("renderDocument:landing-240-nodes", 400, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 8,
        route: "/landing",
        sections: 3,
        title: "Landing"
      })
    ),
    runRenderBenchmark("renderDocument:dashboard-1000-nodes", 120, () =>
      buildPageDocument({
        buttonsPerCard: 3,
        cardsPerSection: 12,
        links: 12,
        route: "/dashboard",
        sections: 6,
        title: "Dashboard"
      })
    ),
    runRerenderBenchmark("rerenderDocument:dashboard-1000-nodes", 80, () =>
      buildPageDocument({
        buttonsPerCard: 3,
        cardsPerSection: 12,
        links: 12,
        route: "/dashboard",
        sections: 6,
        title: "Dashboard"
      })
    ),
    runNavigationBenchmark("internalUrlRequest:nav-click", 40000, "/dashboard/settings")
  ];
}

import {
  buildPageDocument,
  runNavigationBenchmark,
  runRenderBenchmark,
  runRerenderBenchmark
} from "./_runtime-harness.mjs";

export function scenarios() {
  return [
    runRenderBenchmark("NotFound:render", 250, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/not-found",
        sections: 3,
        title: "NotFound"
      })
    ),
    runRerenderBenchmark("NotFound:rerender", 150, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/not-found",
        sections: 3,
        title: "NotFound"
      })
    ),
    runNavigationBenchmark("NotFound:nav", 20000, "/not-found")
  ];
}

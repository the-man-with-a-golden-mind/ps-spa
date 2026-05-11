import {
  buildPageDocument,
  runNavigationBenchmark,
  runRenderBenchmark,
  runRerenderBenchmark
} from "./_runtime-harness.mjs";

export function scenarios() {
  return [
    runRenderBenchmark("Playground:render", 250, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/playground",
        sections: 3,
        title: "Playground"
      })
    ),
    runRerenderBenchmark("Playground:rerender", 150, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/playground",
        sections: 3,
        title: "Playground"
      })
    ),
    runNavigationBenchmark("Playground:nav", 20000, "/playground")
  ];
}

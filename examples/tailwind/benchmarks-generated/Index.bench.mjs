import {
  buildPageDocument,
  runNavigationBenchmark,
  runRenderBenchmark,
  runRerenderBenchmark
} from "./_runtime-harness.mjs";

export function scenarios() {
  return [
    runRenderBenchmark("Index:render", 250, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/",
        sections: 3,
        title: "Index"
      })
    ),
    runRerenderBenchmark("Index:rerender", 150, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/",
        sections: 3,
        title: "Index"
      })
    ),
    runNavigationBenchmark("Index:nav", 20000, "/")
  ];
}

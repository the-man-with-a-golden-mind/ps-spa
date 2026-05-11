import {
  buildPageDocument,
  runNavigationBenchmark,
  runRenderBenchmark,
  runRerenderBenchmark
} from "./_runtime-harness.mjs";

export function scenarios() {
  return [
    runRenderBenchmark("PeopleNameParam:render", 250, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/people/:name",
        sections: 3,
        title: "PeopleNameParam"
      })
    ),
    runRerenderBenchmark("PeopleNameParam:rerender", 150, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/people/:name",
        sections: 3,
        title: "PeopleNameParam"
      })
    ),
    runNavigationBenchmark("PeopleNameParam:nav", 20000, "/people/:name")
  ];
}

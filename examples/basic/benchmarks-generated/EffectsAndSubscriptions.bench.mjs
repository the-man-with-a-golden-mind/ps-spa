import {
  buildPageDocument,
  runNavigationBenchmark,
  runRenderBenchmark,
  runRerenderBenchmark
} from "./_runtime-harness.mjs";

export function scenarios() {
  return [
    runRenderBenchmark("EffectsAndSubscriptions:render", 250, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/effects-and-subscriptions",
        sections: 3,
        title: "EffectsAndSubscriptions"
      })
    ),
    runRerenderBenchmark("EffectsAndSubscriptions:rerender", 150, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/effects-and-subscriptions",
        sections: 3,
        title: "EffectsAndSubscriptions"
      })
    ),
    runNavigationBenchmark("EffectsAndSubscriptions:nav", 20000, "/effects-and-subscriptions")
  ];
}

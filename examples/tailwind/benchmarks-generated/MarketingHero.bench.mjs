import {
  buildPageDocument,
  runNavigationBenchmark,
  runRenderBenchmark,
  runRerenderBenchmark
} from "./_runtime-harness.mjs";

export function scenarios() {
  return [
    runRenderBenchmark("MarketingHero:render", 250, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/marketing/hero",
        sections: 3,
        title: "MarketingHero"
      })
    ),
    runRerenderBenchmark("MarketingHero:rerender", 150, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/marketing/hero",
        sections: 3,
        title: "MarketingHero"
      })
    ),
    runNavigationBenchmark("MarketingHero:nav", 20000, "/marketing/hero")
  ];
}

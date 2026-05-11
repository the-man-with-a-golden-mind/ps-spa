import {
  buildPageDocument,
  runNavigationBenchmark,
  runRenderBenchmark,
  runRerenderBenchmark
} from "./_runtime-harness.mjs";

export function scenarios() {
  return [
    runRenderBenchmark("GuidesSlugParam:render", 250, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/guides/:slug",
        sections: 3,
        title: "GuidesSlugParam"
      })
    ),
    runRerenderBenchmark("GuidesSlugParam:rerender", 150, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/guides/:slug",
        sections: 3,
        title: "GuidesSlugParam"
      })
    ),
    runNavigationBenchmark("GuidesSlugParam:nav", 20000, "/guides/:slug")
  ];
}

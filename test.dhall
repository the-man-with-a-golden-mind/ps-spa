{ name = "ps-spa-test"
, dependencies =
    [ "arrays"
    , "console"
    , "effect"
    , "foldable-traversable"
    , "integers"
    , "maybe"
    , "prelude"
    , "psci-support"
    , "refs"
    , "strings"
    ]
, packages = ./packages.dhall
, sources = [ "src/**/*.purs", "test/**/*.purs" ]
}

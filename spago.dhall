{ name = "ps-spa"
, dependencies = [ "arrays", "effect", "foldable-traversable", "integers", "maybe", "prelude", "psci-support", "refs", "strings" ]
, packages = ./packages.dhall
, sources = [ "src/**/*.purs" ]
}

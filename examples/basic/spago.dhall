{ name = "ps-spa-basic"
, dependencies = [ "arrays", "const", "effect", "foldable-traversable", "integers", "maybe", "prelude", "psci-support", "refs", "strings", "unsafe-coerce" ]
, packages = ./node_modules/ps-spa/packages.dhall
, sources = [ "src/**/*.purs", "node_modules/ps-spa/src/**/*.purs" ]
}

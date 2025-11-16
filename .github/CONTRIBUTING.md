# Contributing

Thanks for taking the time to contribute!

## Getting Started

To get started, make sure that you have [`pixi`](https://pixi.sh/latest/) installed: this package manager will ensure
that all required dependencies are available. Then, run

```
pixi install
```

> [!NOTE] If you do not want to prefix all commands with `pixi run` to run them in the environment created by `pixi`,
> you can auto-activate the environment with [`direnv`](https://direnv.net/). To this end, simply run `direnv allow`
> once when working in this repository.

To install all JavaScript dependencies, also make sure to run

```
pixi run pnpm install
```

This needs to be done every time the dependencies get updated.

## Committing

Before committing, make sure that:

- Your code adheres to the code style enforced in this repository
- The TypeScript code is compiled to JavaScript in the `dist/` directory. This is the code that actually runs when the
  action is executed.

To this end, simply execute `pixi run pre-commit run` before committing. If you run `pixi run pre-commit install` once,
this will be done automatically when calling `git commit`.

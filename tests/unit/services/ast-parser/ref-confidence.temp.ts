
      export interface Foo {}
      export function bar(arg: Foo) { return 1; }
      export function baz() {
        // unresolved external reference
        return maybeGlobal + 1;
      }
    
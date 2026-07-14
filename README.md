# tree-sitter-plsql

A [tree-sitter](https://tree-sitter.github.io/) grammar for Oracle PL/SQL,
tuned for real-world enterprise codebases.

Highlights:

- packages, object types (incl. `OVERRIDING`/`FINAL`/`MAP`/`ORDER` members,
  constructors, `SELF` parameters, `(self AS Super).method()` dispatch)
- real-world SQL: inline views, set operators, hierarchical queries
  (`CONNECT BY`, `PRIOR`, `CONNECT_BY_ROOT`), recursive CTEs with
  `SEARCH`/`CYCLE`, `MERGE`, tuple predicates, quantified comparisons
  (`<= ALL`), `(+)` outer joins, analytic functions with `OVER`/
  `WITHIN GROUP`/`KEEP`, `XMLTABLE`/`JSON_TABLE`/`XMLELEMENT`/`XMLFOREST`
- PL/SQL specifics: `FORALL`/`BULK COLLECT`/`SQL%BULK_*`, conditional
  compilation (`$IF`/`$END` as named trivia, `$$inquiry` directives),
  `q'[...]'` alternative quoting, datetime/interval literals, collection
  operations (`MULTISET`, `MEMBER OF`, `IS EMPTY`), accented identifiers
  (Latin-1: `descripción`)

Known, deliberate gaps: `LISTAGG(DISTINCT ...)`, `@dblink` references,
Oracle-wrapped (obfuscated) bodies. See the state-budget note below.

## The keyword problem

Oracle keywords are not reserved: `LoopContacts`, `newPeriod`, `ordernr` or a
table alias called `outer` are all legal identifiers. tree-sitter's lexer
prefers token precedence over match length, so a naive grammar splits them
(`LOOP` + `Contacts`). This grammar routes 57 conflict-prone keywords through
an external scanner (`src/scanner.c`) that emits a keyword only on an exact,
case-insensitive whole-word match and defers to the identifier otherwise.

When adding a keyword to the scanner, keep `externals` in `grammar.js` and
the `TokenType`/`KEYWORDS` tables in `src/scanner.c` in the same order.

## The state budget

**Keep `STATE_COUNT` (top of the generated `src/parser.c`) below ~48,000.**
Larger tables generate without errors but misparse at runtime in
layout-dependent ways. Grammar constructs differ wildly in cost: a
keyword-gated rule is nearly free, while an `optional(...)` in front of a hot
expression context or an external token in a busy position can cost
thousands of states. Measure after every change:

```sh
tree-sitter generate
grep "define STATE_COUNT" src/parser.c
tree-sitter generate --report-states-for-rule -   # per-rule attribution
```

## Development

```sh
npm install tree-sitter-cli
tree-sitter generate     # regenerate src/parser.c (commit it)
tree-sitter test         # corpus tests in test/corpus/
tree-sitter parse examples/test-constructs.sql -q
```

The generated `src/parser.c` **is** committed: generation is layout-
nondeterministic near the state budget, so consumers build from a verified
parser rather than regenerating.

After grammar changes, verify against a real codebase; a file parses cleanly
when it contains no `ERROR`/`MISSING` nodes.

## References

- [Database PL/SQL Language Reference](https://docs.oracle.com/en/database/oracle/oracle-database/21/lnpls/index.html)

// External scanner: boundary-aware lexing for keywords that commonly prefix
// identifiers (LoopContacts, SetParamValue, LogMsg, ReplaceX). The built-in
// lexer resolves token conflicts by precedence before match length and has no
// lookahead, so a keyword token can win against a longer identifier. This
// scanner reads the whole word first and only emits the keyword on an exact,
// case-insensitive match; otherwise it defers to the internal lexer, which
// then lexes the full identifier.

#include "tree_sitter/parser.h"

// Order must match the `externals` array in grammar.js.
enum TokenType {
  KW_LOOP,
  KW_SET,
  KW_LOG,
  KW_REPLACE,
  KW_FORALL,
  KW_SAVE,
  KW_TO,
  KW_ROW,
  KW_IS,
  KW_BEGIN,
  KW_IN,
  KW_FIRST,
  KW_END,
  KW_IF,
  KW_CASE,
  KW_FOR,
  KW_WHILE,
  KW_DECLARE,
  KW_RETURN,
  KW_INSERT,
  KW_UPDATE,
  KW_DELETE,
  KW_SELECT,
  KW_MERGE,
  KW_EXECUTE,
  KW_NOT,
  KW_NULL,
  KW_TRUE,
  KW_FALSE,
  KW_WHEN,
  KW_THEN,
  KW_ELSE,
  KW_ELSIF,
  KW_CURSOR,
  KW_TYPE,
  KW_RECORD,
  KW_PROCEDURE,
  KW_FUNCTION,
  KW_COUNT,
  KW_LAST,
  KW_NEXT,
  KW_PRIOR,
  KW_EXISTS,
  KW_EXTEND,
  KW_LIMIT,
  KW_TRIM,
  KW_AT,
  KW_OUTER,
  KW_INNER,
  KW_ROLLBACK,
  KW_FETCH,
  KW_OVER,
  KW_NEW,
  KW_ORDER,
  KW_COLLECT,
  KW_MAP,
  KW_ALL,
  TOKEN_COUNT
};

static const char *const KEYWORDS[TOKEN_COUNT] = {
  "loop", "set", "log", "replace", "forall", "save", "to", "row",
  "is", "begin", "in", "first", "end",
  "if", "case", "for", "while", "declare", "return",
  "insert", "update", "delete", "select", "merge", "execute",
  "not", "null", "true", "false", "when", "then", "else", "elsif",
  "cursor", "type", "record", "procedure", "function",
  "count", "last", "next", "prior", "exists", "extend", "limit", "trim",
  "at", "outer", "inner", "rollback", "fetch", "over", "new",
  "order", "collect", "map", "all",
};

void *tree_sitter_plsql_external_scanner_create(void) { return 0; }
void tree_sitter_plsql_external_scanner_destroy(void *payload) {}
unsigned tree_sitter_plsql_external_scanner_serialize(void *payload, char *buffer) { return 0; }
void tree_sitter_plsql_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}

static int is_word_char(int32_t c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
         (c >= '0' && c <= '9') || c == '_' || c == '$' || c == '#' ||
         // Latin-1 Supplement letters (á, ñ, ç, ü, ...): U+00C0-U+00FF
         // excluding multiplication U+00D7 and division U+00F7 signs
         (c >= 0x00C0 && c <= 0x00FF && c != 0x00D7 && c != 0x00F7);
}

static int to_lower(int32_t c) {
  return (c >= 'A' && c <= 'Z') ? c + ('a' - 'A') : c;
}

static int word_is(const char *buf, unsigned len, const char *kw) {
  unsigned i = 0;
  for (; kw[i]; i++) {
    if (i >= len || buf[i] != kw[i]) return 0;
  }
  return i == len;
}

bool tree_sitter_plsql_external_scanner_scan(void *payload, TSLexer *lexer,
                                             const bool *valid_symbols) {
  int any_valid = 0;
  for (int t = 0; t < TOKEN_COUNT; t++) {
    if (valid_symbols[t]) { any_valid = 1; break; }
  }
  if (!any_valid) return false;

  // Skip whitespace without including it in the token.
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
         lexer->lookahead == '\r' || lexer->lookahead == '\n' ||
         lexer->lookahead == '\f') {
    lexer->advance(lexer, true);
  }

  // Words never start with a digit; let the internal lexer handle anything
  // that is not a word at all (comments, strings, operators, ...).
  if (!is_word_char(lexer->lookahead) ||
      (lexer->lookahead >= '0' && lexer->lookahead <= '9')) {
    return false;
  }

  // Read the complete word (maximal munch).
  char buf[12]; // longest keyword: "procedure" (9) + slack
  unsigned len = 0;
  while (is_word_char(lexer->lookahead)) {
    if (len >= sizeof(buf) - 1) return false; // longer than any keyword
    buf[len++] = (char)to_lower(lexer->lookahead);
    lexer->advance(lexer, false);
  }
  lexer->mark_end(lexer);

  for (int t = 0; t < TOKEN_COUNT; t++) {
    if (valid_symbols[t] && word_is(buf, len, KEYWORDS[t])) {
      lexer->result_symbol = t;
      return true;
    }
  }
  return false; // whole word is not one of ours -> identifier et al.
}

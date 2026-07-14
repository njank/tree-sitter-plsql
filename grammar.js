/*-----------------------------------------------------------------------------------------------
    |@|description grammar file for Oracle pl/sql
-----------------------------------------------------------------------------------------------*/

function kw(word) {
    return token(prec(1, new RegExp(word
        .toLowerCase()
        .split('')
        .map(letter => `[${letter}${letter.toUpperCase()}]`)
        .join('')
    )))
}


// SYMBOLS
const ASSIGNMENT = ':='
const ASSOCIATION = '=>'
const CONCAT = '||'
const NOT_EQUAL_1 = '<>'
const NOT_EQUAL_2 = '!='
const NOT_EQUAL_3 = '~='
const NOT_EQUAL_4 = '^='
const LESS_THEN_EQUAL = '<='
const GREATER_THEN_EQUAL = '>='
const EXPONENT = '**'
const LABEL_START = '<<'
const LABEL_END = '>>'
const RANGE = '..'
const SEMICOLON = ';'
const POINT = '.'
const DOUBLE_POINT = ':'
const COMMA = ','
const PLUS = '+'
const MINUS = '-'
const MULTIPLICATION = '*'
const DIVISON = '/'
const EQUAL = '='
const LESS_THEN = '<'
const GREATER_THEN = '>'
const PERCENT = '%'
const BRACKET_LEFT = '('
const BRACKET_RIGHT = ')'
const QUOTE_SINGLE = "'"
const QUOTE_DOUBLE = '"'
const REMOTE = '@'
const DIVISION = '/'
const COLON = ':'
const UNDERSCORE = '_'

module.exports = grammar({
    name: 'plsql',
    conflicts: $ => [
        // NOTE: `tree-sitter generate` reports which entries are unnecessary
        // ("Warning: unnecessary conflicts"); those were removed. Externals
        // (declare/for/row/new/...) need no [$.kw_X, $.identifier] entries --
        // the scanner decides with word boundaries.
        [$._query_partiion_clause],
        [$._outer_join_clause],
        [$._query_table_expression_ref_element],
        [$._expression_base_elements, $._expression_base_boolean_elements],
        [$.type_definition_ref_cursor_return, $._referenced_datatypes],
        [$._cursor_declaration_return_datatype, $._referenced_element_name],
        [$._cross_outer_apply_clause, $._table_reference],
        [$._table_reference],  // alias vs LOG ERRORS clause (kw_log is a soft keyword)
        [$._object_subtype_def],  // `under Y` followed by attribute list vs bare subtype
        // ( expr ) as boolean group vs comparison operand vs plain expression
        [$._expression_element, $._expression_base_elements, $._expression_base_boolean_elements],
        [$._character_datatypes],  // `table of char (...)`: size vs following construct
        [$._ansi_supported_datatypes],
        [$._number_datatypes],
        [$._long_and_raw_datatypes],
        [$._datetime_datatypes],
        [$._rowid_datatypes],
        // top-level anonymous block vs block as nested statement
        [$._element, $.statement],
        // ( subquery ) as inline view vs parenthesized subquery
        [$._subquery_element, $._query_table_expression_inline_view],
        // field NOT NULL vs NOT OVERRIDING/FINAL on the following member spec
        [$.field_definition],
        // x IN (a, b) ... vs (a, b) NOT IN ... -- tuple membership
        [$._expression_base_boolean_in, $._expression_base_boolean_tuple_in],
        // TRUE/FALSE as a bare boolean element vs literal comparison operand
        [$._expression_base_boolean_elements, $._literal_boolean],

    ],
    word: $ => $._unquoted_identifier,
    // Lexed by src/scanner.c with word-boundary semantics: emitted only on an
    // exact word match, so identifiers like LoopContacts / SetParamValue /
    // LogMsg lex as one identifier.
    externals: $ => [
        // Order must match enum TokenType in src/scanner.c.
        $.kw_loop,
        $.kw_set,
        $.kw_log,
        $.kw_replace,
        $.kw_forall,
        $.kw_save,
        $.kw_to,
        $.kw_row,
        $.kw_is,
        $.kw_begin,
        $.kw_in,
        $.kw_first,
        $.kw_end,
        $.kw_if,
        $.kw_case,
        $.kw_for,
        $.kw_while,
        $.kw_declare,
        $.kw_return,
        $.kw_insert,
        $.kw_update,
        $.kw_delete,
        $.kw_select,
        $.kw_merge,
        $.kw_execute,
        $.kw_not,
        $.kw_null,
        $.kw_true,
        $.kw_false,
        $.kw_when,
        $.kw_then,
        $.kw_else,
        $.kw_elsif,
        $.kw_cursor,
        $.kw_type,
        $.kw_record,
        $.kw_procedure,
        $.kw_function,
        $.kw_count,
        $.kw_last,
        $.kw_next,
        $.kw_prior,
        $.kw_exists,
        $.kw_extend,
        $.kw_limit,
        $.kw_trim,
        $.kw_at,
        $.kw_outer,
        $.kw_inner,
        $.kw_rollback,
        $.kw_fetch,
        $.kw_over,
        $.kw_new,
        $.kw_order,
        $.kw_collect,
        $.kw_map,
        $.kw_all,
        // NOTE: keep STATE_COUNT below ~48k (see readme); check after generate
    ],
    extras: $ => [
        $.comment_sl,
        $.comment_ml,
        /[\s\f\uFEFF\u2060\u200B]|\\\r?\n/,
        // conditional compilation directives are ignorable trivia; the code
        // of all branches stays in the tree. Must be a NAMED extra: anonymous
        // regex extras are skipped inside the internal lexer, which bypasses
        // the external scanner for the token that follows.
        $.conditional_compilation,
    ],
    rules: {
        source_file: $ => repeat($._element),
        _element: $ => choice(
            $._ddl_statement,
            $.statement,
            // top-level anonymous block: DECLARE ... BEGIN ... END; [/]
            seq($.plsql_block, optional(DIVISION)),
        ),
        _ddl_statement: $ => choice(
            $._alter_statement,
            $._create_statement,
            $._drop_statement,
        ),

        // DROP
        _drop_statement: $ => choice(
            $.drop_function,
            $.drop_procedure,
            $.drop_package,
            $.drop_type,
            $.drop_type_body,
            $.drop_trigger,
            $.drop_library,
            $.drop_sequence,
            $.drop_view,
            $.drop_table
        ),
        drop_table: $ => seq(
            $.kw_drop,
            $.kw_table,
            $.referenced_element,
            SEMICOLON,
        ),
        drop_procedure: $ => seq(
            $.kw_drop,
            $.kw_procedure,
            $.referenced_element,
            SEMICOLON,
        ),
        drop_view: $ => seq(
            $.kw_drop,
            $.kw_view,
            $.referenced_element,
            SEMICOLON,
        ),
        drop_function: $ => seq(
            $.kw_drop,
            $.kw_function,
            $.referenced_element,
            SEMICOLON,
        ),
        drop_library: $ => seq(
            $.kw_drop,
            $.kw_library,
            $.identifier,
            SEMICOLON,
        ),
        drop_trigger: $ => seq(
            $.kw_drop,
            $.kw_trigger,
            $.referenced_element,
            SEMICOLON,
        ),
        drop_type: $ => seq(
            $.kw_drop,
            $.kw_type,
            $.referenced_element,
            optional(choice($.kw_force, $.kw_validate)),
            SEMICOLON,
        ),
        drop_type_body: $ => seq(
            $.kw_drop,
            $.kw_type,
            $.kw_body,
            $.referenced_element,
            SEMICOLON,
        ),
        drop_package: $ => seq(
            $.kw_drop,
            $.kw_package,
            optional($.kw_body),
            $.referenced_element,
            SEMICOLON,
        ),
        drop_sequence: $ => seq(
            $.kw_drop,
            $.kw_sequence,
            $.referenced_element,
            SEMICOLON,
        ),

        // CREATE
        _create_statement: $ => choice(
            $.create_package,
            $.create_package_body,
            $.create_procedure,
            $.create_function,
            $.create_trigger,
            $.create_type,
            $.create_type_body,
            $.create_table,
            $.create_view,
            $.create_sequence,
        ),
        create_trigger: $ => prec(1, seq(
            $.create_obj,
            optional($._editionable_noneditionable),
            $.kw_trigger,
            optional($._schema),
            field("trigger_name", $.identifier),
            optional($.sharing_clause),
            repeat($.default_collation_clause),
            choice(
                $._simple_dml_trigger,
                $._instead_of_dml_trigger,
                $._compound_dml_trigger,
                $._system_trigger,
            ),
            optional(DIVISION),
        )),
        create_library: $ => seq(
            $.create_obj,
            optional($._editionable_noneditionable),
            $.kw_library,
            optional($._schema),
            field("library_name", $.identifier),
            optional($.sharing_clause),
            $._is_as,
            choice(
                seq($.literal_string),
                seq($.literal_string, $.kw_in, $.identifier),
            ),
            optional(seq($.kw_agent, $.literal_string)),
            optional(seq($.kw_credential, $.referenced_element)),
            SEMICOLON,
            optional(DIVISION),
        ),
        create_type: $ => seq(
            $.create_obj,
            optional($._editionable_noneditionable),
            $.kw_type,
            $.plsql_type_source,
            optional(DIVISION),
        ),
        plsql_type_source: $ => seq(
            optional($._schema),
            field("type_name", $.identifier),
            optional($.kw_force),
            optional(seq($.kw_oid, $.literal_string)),
            optional($.sharing_clause),
            optional($.default_collation_clause),
            repeat(choice($.invoker_rights_clause, $.accessible_by_clause)),
            choice(
                $._object_base_type_def,
                $._object_subtype_def
            ),
            // scripts may terminate with `/` alone instead of `;`
            optional(SEMICOLON),
        ),

        _object_base_type_def: $ => seq(
            $._is_as,
            choice(
                $._object_type_def,
                $.type_definition_varray,
                $.type_definition_nested_table,
            ),
        ),

        _object_subtype_def: $ => seq(
            $.kw_under,
            $.referenced_element,
            optional($._type_attribute_list),
            repeat($.inheritance_clause), // NOT INSTANTIABLE NOT FINAL ...
        ),

        _type_attribute_list: $ => seq(
            BRACKET_LEFT,
            $._type_attribute_list_content,
            BRACKET_RIGHT,
        ),

        _type_attribute_list_content: $ => repeat1(
            seq(
                optional(COMMA),
                choice(
                    $.field_definition,
                    $.element_spec_subprogram_spec,
                    $.element_spec_map_order_function_spec,
                    $.element_spec_constructor_spec
                )
            )
        ),

        element_spec_list: $ => seq(
            repeat1(
                choice(
                    $.element_spec_subprogram_spec,
                    $.element_spec_map_order_function_spec,
                    $.element_spec_constructor_spec,
                ),
            ),
        ),

        _object_type_def: $ => seq(
            $.kw_object,
            choice(
                seq(BRACKET_LEFT, BRACKET_RIGHT),
                $._type_attribute_list
            ),
            repeat($.inheritance_clause), // NOT INSTANTIABLE NOT FINAL ...
        ),

        constructor_definition_in_body: $ => prec(2, seq(
            optional($.kw_final),
            optional($.kw_instantiable),
            $.kw_constructor,
            $.kw_function,
            field("name", $.identifier),
            optional($.parameter_declaration),
            $.kw_return,
            $.kw_self,
            $.kw_as,
            $.kw_result,
            $._is_as,
            seq(optional(repeat($._declare_section_element)), $.body)
        )),

        create_type_body: $ => seq(
            $.create_obj,
            optional($._editionable_noneditionable),
            $.kw_type,
            $.kw_body,
            optional($._schema),
            field("type_name", $.identifier),
            optional($.sharing_clause),
            $._is_as,
            repeat1(choice(
                $.constructor_definition_in_body,
                $.procedure_definition,
                $.function_definition
            )),
            $.end_obj_named,
            optional(DIVISION),
        ),

        create_view: $ => prec.right(1, seq(
            $.kw_create,
            optional($.kw_or),
            optional($.kw_replace),
            $.kw_view,
            optional($._schema),
            field("view_name", $.identifier),
            optional(seq(
                BRACKET_LEFT,
                field("column_name", $.identifier),
                repeat(seq(COMMA, field("column_name", $.identifier))),
                BRACKET_RIGHT,
            )),
            $._is_as,
            choice(
                seq(
                    $.with_clause,
                    $._subquery
                ),
                $._subquery
            ),
            optional($.with_read_only_clause),
            SEMICOLON,
            optional(DIVISION),
        )),

        create_procedure: $ => seq(
            $.create_obj,
            optional($._editionable_noneditionable),
            $.kw_procedure,
            optional($._schema),
            field("prc_name", $.identifier),
            optional($.parameter_declaration),
            optional($.sharing_clause),
            repeat($._procedure_properties),
            $._is_as,
            choice(
                seq($.call_spec_ext, SEMICOLON),
                // body's END [name]; already carries the semicolon
                seq(optional(repeat($._declare_section_element)), $.body)
            ),
            optional(DIVISION)
        ),

        create_function: $ => seq(
            $.create_obj,
            optional($._editionable_noneditionable),
            $.kw_function,
            optional($._schema),
            field("fnc_name", $.identifier),
            optional($.parameter_declaration),
            $.return_declaration,
            optional($.sharing_clause),
            repeat($._function_properties),
            $._is_as,
            choice(
                seq($.call_spec_ext, SEMICOLON),
                // body's END [name]; already carries the semicolon
                seq(optional(repeat($._declare_section_element)), $.body)
            ),
            optional(DIVISION)
        ),
        create_package: $ => seq(
            $.create_obj,
            optional($._editionable_noneditionable),
            $.kw_package,
            optional($._schema),
            field("package_name", $.identifier),
            optional($.sharing_clause),
            repeat($._package_property_element),
            $._is_as,
            repeat1($._item_list_1), // cursor_definition covers spec cursors
            $.end_obj_named,
            optional(DIVISION),
        ),
        create_package_body: $ => seq(
            $.create_obj,
            optional($._editionable_noneditionable),
            $.kw_package,
            $.kw_body,
            optional($._schema),
            field("package_name", $.identifier),
            optional($.sharing_clause),
            $._is_as,
            repeat(choice(
                $._item_list_1,
                $.procedure_definition,
                $.function_definition
            )),
            optional(seq(
                $.kw_begin,
                repeat($.statement),
                optional($.exception_block)
            )),
            $.end_obj_named,
            optional(DIVISION),
        ),

        create_sequence: $ => seq(
            $.kw_create,
            $.kw_sequence,
            $.referenced_element,
            repeat(choice(
                seq($.kw_start, $.kw_with, $._literal_number),
                seq($.kw_increment, $.kw_by, $._literal_number),
                seq($.kw_maxvalue, $._literal_number),
                seq($.kw_minvalue, $._literal_number),
                seq($.kw_cycle),
                seq($.kw_nocycle),
                seq($.kw_cache, $._literal_number),
                seq($.kw_nocache),
                seq($.kw_order),
                seq($.kw_noorder)
            )),
            SEMICOLON,
        ),
        _package_property_element: $ => choice(
            $.default_collation_clause,
            $.invoker_rights_clause,
            $.accessible_by_clause,
        ),
        _alter_statement: $ => seq(
            choice(
                $.alter_trigger,
                $.alter_package,
                $.alter_function,
                $.alter_procedure,
                $.alter_library,
                $.alter_type,
                $.alter_table,
                $.alter_sequence,
            ),
        ),
        alter_package: $ => seq(
            $.kw_alter,
            $.kw_package,
            optional($._schema),
            field("obj_name", $.identifier),
            choice(
                $._compile_clause,
                $._editionable_noneditionable,
            ),
            SEMICOLON,
        ),
        alter_procedure: $ => seq(
            $.kw_alter,
            $.kw_procedure,
            optional($._schema),
            field("obj_name", $.identifier),
            choice(
                $._compile_clause,
                $._editionable_noneditionable,
            ),
            SEMICOLON,
        ),
        alter_function: $ => seq(
            $.kw_alter,
            $.kw_function,
            optional($._schema),
            field("obj_name", $.identifier),
            choice(
                $._compile_clause,
                $._editionable_noneditionable,
            ),
            SEMICOLON,
        ),
        alter_trigger: $ => seq(
            $.kw_alter,
            $.kw_trigger,
            optional($._schema),
            field("trigger_name", $.identifier),
            choice(
                $._compile_clause,
                $._editionable_noneditionable,
                $._enable_disable,
                $._rename_to,
            ),
            SEMICOLON,
        ),
        alter_library: $ => seq(
            $.kw_alter,
            $.kw_library,
            optional($._schema),
            field("obj_name", $.identifier),
            choice(
                $._compile_clause,
                $._editionable_noneditionable,
            ),
            SEMICOLON,
        ),
        alter_type: $ => seq(
            $.kw_alter,
            $.kw_type,
            optional($._schema),
            field("type_name", $.identifier),
            choice(
                $._editionable_noneditionable,
                $._alter_type_clause
            ),
            optional($.dependent_handling_clause),
            SEMICOLON,
        ),
        _alter_type_clause: $ => choice(
            $._compile_clause,
            $._type_replace_clause,
            $.kw_reset,
            $._final_instantiable,
            // rule group for ALTER METHOD, ATTRIBUTE, COLLECTION
            repeat1(
                choice(
                    $._alter_method_spec,
                    $._alter_attribute_definition,
                    $._alter_collection_clause
                )
            ),
        ),
        _type_replace_clause: $ => seq(
            $.kw_replace,
            repeat(choice($.invoker_rights_clause, $.accessible_by_clause)),
            $.kw_as,
            $.kw_object,
            // reuse the existing attribute/method list rule
            optional($._type_attribute_list),
        ),
        _alter_method_spec: $ => seq(
            $.alter_method_spec_element,
            repeat(seq(COMMA, $.alter_method_spec_element)),
        ),

        alter_method_spec_element: $ => seq(
            choice($.kw_add, $.kw_drop),
            choice(
                $.element_spec_map_order_function_spec,
                $.element_spec_subprogram_spec,
            ),
        ),
        _alter_attribute_definition: $ => choice(
            $.alter_attribute_definition_add_modify,
            $.alter_attribute_definition_drop,
        ),

        alter_attribute_definition_add_modify: $ => seq(
            choice($.kw_add, $.kw_modify),
            $.kw_attribute,
            $.alter_attribute_definition_attribute_datatype,
        ),

        alter_attribute_definition_drop: $ => seq(
            $.kw_drop,
            $.kw_attribute,
            $.alter_attribute_definition_attribute,
        ),

        alter_attribute_definition_attribute: $ => choice(
            $.identifier,
            seq(
                BRACKET_LEFT,
                $.identifier,
                repeat(seq(COMMA, $.identifier)),
                BRACKET_RIGHT,
            ),
        ),

        alter_attribute_definition_attribute_datatype: $ => choice(
            $.alter_attribute_definition_attribute_datatype_element,
            seq(
                BRACKET_LEFT,
                $.alter_attribute_definition_attribute_datatype_element,
                repeat(seq(COMMA, $.alter_attribute_definition_attribute_datatype_element)),
                BRACKET_RIGHT,
            ),
        ),

        alter_attribute_definition_attribute_datatype_element: $ => seq(
            $.identifier,
            $.datatype,
        ),
        _alter_collection_clause: $ => seq(
            $.kw_modify,
            choice(
                seq($.kw_limit, $._literal_number),
                seq($.kw_element, $.kw_type, $.datatype),
            ),
        ),
        alter_table: $ => seq(
            $.kw_alter,
            $.kw_table,
            $.referenced_element,
            $.kw_add,
            BRACKET_LEFT,
            $.table_element,
            repeat(seq(COMMA, $.table_element)),
            BRACKET_RIGHT,
            SEMICOLON,
        ),

        alter_sequence: $ => seq(
            $.kw_alter,
            $.kw_sequence,
            $.referenced_element,
            choice(
                seq($.kw_increment, $.kw_by, $._literal_number),
                seq($.kw_start, $.kw_with, $._literal_number),
                seq($.kw_maxvalue, $._literal_number),
                seq($.kw_minvalue, $._literal_number),
                seq($.kw_cycle),
                seq($.kw_nocycle),
                seq($.kw_cache, $._literal_number),
                seq($.kw_nocache),
                seq($.kw_order),
                seq($.kw_noorder)
            ),
            SEMICOLON,
        ),
        // _alter_type_alter_x: $ => seq(
        //     choice(
        //         $.alter_method_spec,
        //         $.alter_attribute_definition,
        //         $.alter_collection_clause,
        //     ),
        // ),
        alter_method_spec: $ => seq(
            $.alter_method_spec_element,
            repeat(seq(COMMA, $.alter_method_spec_element)),
        ),
        alter_method_spec_element: $ => seq(
            choice(
                $.kw_add,
                $.kw_drop,
            ),
            choice(
                $.element_spec_map_order_function_spec,
                $.element_spec_subprogram_spec,
            ),
        ),
        alter_collection_clause: $ => seq(
            $.kw_modify,
            choice(
                seq($.kw_limit, $._literal_number),
                seq($.kw_element, $.kw_type, $.datatype),
            ),
        ),
        alter_attribute_definition: $ => choice(
            $.alter_attribute_definition_add_modify,
            $.alter_attribute_definition_drop,
        ),
        alter_attribute_definition_drop: $ => seq(
            $.kw_drop,
            $.kw_attribute,
            $.alter_attribute_definition_attribute,
        ),
        alter_attribute_definition_add_modify: $ => seq(
            choice(
                $.kw_add,
                $.kw_modify,
            ),
            $.kw_attribute,
            $.alter_attribute_definition_attribute_datatype,
        ),
        alter_attribute_definition_attribute: $ => choice(
            $.identifier,
            seq(
                BRACKET_LEFT,
                $.identifier,
                repeat(seq(COMMA, $.identifier)),
                BRACKET_RIGHT,
            ),
        ),
        alter_attribute_definition_attribute_datatype: $ => choice(
            $.alter_attribute_definition_attribute_datatype_element,
            seq(
                BRACKET_LEFT,
                $.alter_attribute_definition_attribute_datatype_element,
                repeat(seq(COMMA, $.alter_attribute_definition_attribute_datatype_element)),
                BRACKET_RIGHT,
            ),
        ),
        alter_attribute_definition_attribute_datatype_element: $ => seq(
            $.identifier,
            $.datatype,
        ),

        _subprog_decl_in_type: $ => choice(
            $.func_decl_in_type,
            $.proc_decl_in_type,
            $.element_spec_constructor_spec,
        ),
        proc_decl_in_type: $ => seq(
            $.kw_procedure,
            field("prc_name", $.identifier),
            $.parameter_declaration,
            $._is_as,
            choice(
                $.call_spec_ext,
                seq(repeat($._declare_section_element), $.body),
            ),
        ),
        func_decl_in_type: $ => seq(
            $.kw_function,
            field("fnc_name", $.identifier),
            $.parameter_declaration,
            $.return_declaration,
            repeat(
                choice(
                    $.invoker_rights_clause,
                    $.accessible_by_clause,
                    $.parallel_enable_clause,
                    $.result_cache_clause,
                    $.kw_deterministic,
                ),
            ),
            optional($.kw_pipelined),
            $._is_as,
            choice(
                $.call_spec_ext,
                seq(repeat($._declare_section_element), $.body),
            ),
        ),

        element_spec_constructor_spec: $ => seq(
            optional($.kw_final),
            optional($.kw_instantiable),
            $.kw_constructor,
            $.kw_function,
            field("name", $.identifier),
            optional($.parameter_declaration),
            $.kw_return,
            $.kw_self,
            $.kw_as,
            $.kw_result,
            optional($.element_spec_is_as_call_spec),
        ),
        element_spec_map_order_function_spec: $ => seq(
            repeat($.inheritance_clause),
            choice(
                $.kw_map,
                $.kw_order,
            ),
            $.kw_member,
            $.element_spec_function_spec,
        ),
        element_spec_subprogram_spec: $ => seq(
            repeat($.inheritance_clause), // [NOT] OVERRIDING / FINAL / INSTANTIABLE
            choice(
                $.kw_member,
                $.kw_static,
            ),
            choice(
                $.element_spec_procedure_spec,
                $.element_spec_function_spec,
            ),
        ),
        element_spec_procedure_spec: $ => seq(
            $.kw_procedure,
            field("prc_name", $.identifier),
            optional($.parameter_declaration),
            optional($.element_spec_is_as_call_spec),
        ),
        element_spec_function_spec: $ => seq(
            $.kw_function,
            field("fnc_name", $.identifier),
            optional($.parameter_declaration),
            $.return_declaration,
            optional($.element_spec_is_as_call_spec),
        ),
        element_spec_is_as_call_spec: $ => seq(
            $._is_as,
            $.call_spec_ext,
        ),
        dependent_handling_clause: $ => choice(
            $.kw_invalidate,
            $._dependent_handling_clause_cascade,

        ),
        _dependent_handling_clause_cascade: $ => seq(
            $.kw_cascade,
            optional(
                choice(
                    $._dependent_handling_clause_convert,
                    $._dependent_handling_clause_including,
                ),
            ),
            optional(
                seq(
                    optional($.kw_force),
                    $.exceptions_clause,
                ),
            )
        ),
        _dependent_handling_clause_including: $ => seq(
            optional($.kw_not),
            $.kw_including,
            $.kw_table,
            $.kw_data,
        ),
        _dependent_handling_clause_convert: $ => seq(
            $.kw_convert,
            $.kw_to,
            $.kw_substitutable,
        ),
        exceptions_clause: $ => seq(
            $.kw_exceptions,
            $.kw_into,
            $.referenced_element,
        ),
        inheritance_clause: $ => seq(
            optional($.kw_not),
            prec(2, choice(
                $.kw_instantiable,
                $.kw_final,
                $.kw_overriding,
                $.kw_persistable,
            )),
        ),
        _final_instantiable: $ => seq(
            optional($.kw_not),
            choice(
                $.kw_instantiable,
                $.kw_final,
            ),
        ),
        call_spec_ext: $ => choice(
            $.java_declaration,
            $.c_declaration,
        ),
        java_declaration: $ => seq(
            $.kw_language,
            $.kw_java,
            $.kw_name,
            field("name", $.literal_string),
        ),
        c_declaration: $ => seq(
            choice(
                seq($.kw_language, $.kw_c),
                $.kw_external,
            ),
            choice(
                seq($.library_name, optional($.name_name)),
                seq($.name_name, optional($.library_name)),
            ),
            optional($.agent_in),
            optional($.with_context),
            optional($.external_parameters),
        ),
        library_name: $ => seq(
            $.kw_library,
            field("library", $.identifier),
        ),
        name_name: $ => seq(
            $.kw_name,
            $.identifier,
        ),
        with_context: $ => seq(
            $.kw_with,
            $.kw_context,
        ),
        agent_in: $ => seq(
            $.kw_agent,
            $.kw_in,
            BRACKET_LEFT,
            field("argument", $.identifier),
            repeat(
                seq(COMMA, field("argument", $.identifier))
            ),
            BRACKET_RIGHT,
        ),
        external_parameters: $ => seq(
            $.kw_parameters,
            BRACKET_LEFT,
            $.external_parameter,
            repeat(
                seq(COMMA, $.external_parameter)
            ),
            BRACKET_RIGHT,
        ),
        external_parameter: $ => choice(
            $.kw_context,
            $.external_parameter_self,
            $.external_parameter_param,
        ),
        external_parameter_self: $ => seq(
            $.kw_self,
            choice(
                $.kw_tdo,
                $.external_parameter_property,
            ),
        ),
        external_parameter_param: $ => seq(
            choice(
                $.kw_return,
                $.identifier,
            ),
            optional($.external_parameter_property),
            optional($.by_reference),
            optional($.identifier),
        ),
        external_parameter_property: $ => choice(
            $.kw_length,
            $.kw_duration,
            $.kw_maxlen,
            $.kw_charsetid,
            $.kw_charsetfrom,
            seq($.kw_indicator, optional(choice($.kw_struct, $.kw_tdo))),
        ),
        by_reference: $ => seq(
            $.kw_by,
            $.kw_reference,
        ),
        _compile_clause: $ => seq(
            $.kw_compile,
            optional($.kw_debug),
            optional(
                choice(
                    $.kw_package,
                    $.kw_specification,
                    $.kw_body,
                ),
            ),
            repeat($.compiler_parameter_clause),
            optional($.reuse_settings),
        ),
        compiler_parameter_clause: $ => seq(
            field("compile_parameter_name", $.identifier),
            EQUAL,
            field("compile_parameter_value", $._literal),
        ),
        _editionable_noneditionable: $ => choice(
            $.kw_editionable,
            $.kw_noneditionable,
        ),
        sharing_clause: $ => choice(
            $.kw_metadata,
            $.kw_none,
        ),
        _compound_dml_trigger: $ => seq(
            $.kw_for,
            $._dml_event_clause_full, // this rule already contains "ON table"
            optional($._referencing_clause),
            // no separate kw_for/kw_each/kw_row here
            $.kw_compound,
            $.kw_trigger,
            repeat($._declare_section_element),
            $._timing_point_section,
        ),
        _system_trigger: $ => seq(
            $._before_after_instead_of,
            choice(
                $._database_event_list_or,
                $._ddl_event_list_or,
            ),
            $.kw_on,
            choice(
                seq($.identifier, POINT, $.kw_schema),
                seq(optional($.kw_pluggable), $.kw_database),
            ),
            optional($._trigger_ordering_clause),
            optional($._enable_disable),
            $._trigger_body,
        ),
        _database_event_list_or: $ => seq(
            $._database_event,
            repeat(seq($.kw_or, $._database_event)),
        ),
        _database_event: $ => choice(
            seq($.kw_after, $.kw_startup),
            seq($.kw_before, $.kw_shutdown),
            seq($.kw_after, $.kw_db_role_change),
            seq($.kw_after, $.kw_servererror),
            seq($.kw_after, $.kw_logon),
            seq($.kw_before, $.kw_logoff),
            seq($.kw_after, $.kw_suspend),
            seq($.kw_after, $.kw_clone),
            seq($.kw_before, $.kw_unplug),
            seq(choice($.kw_after, $.kw_before), $.kw_set, $.kw_container),
        ),
        _ddl_event_list_or: $ => seq(
            $._ddl_event,
            repeat(seq($.kw_or, $._ddl_event)),
        ),
        _ddl_event: $ => choice(
            $.kw_alter,
            $.kw_analyze,
            seq($.kw_associate, $.kw_statistics),
            $.kw_audit,
            $.kw_comment,
            $.kw_create,
            seq($.kw_disassociate, $.kw_statistics),
            $.kw_drop,
            $.kw_grant,
            $.kw_noaudit,
            $.kw_rename,
            $.kw_revoke,
            $.kw_truncate,
            $.kw_ddl,
        ),
        _instead_of_dml_trigger: $ => seq(
            $.kw_instead,
            $.kw_of,
            choice($.kw_delete, $.kw_insert, $.kw_update),
            repeat(seq($.kw_or, choice($.kw_delete, $.kw_insert, $.kw_update))),
            $.kw_on,
            optional($._nested_table),
            $.referenced_element,
            // FOR EACH ROW is implicit for INSTEAD OF triggers -- optional;
            // both clause orders allowed
            optional(choice(
                seq(optional($._referencing_clause), $.kw_for, $.kw_each, $.kw_row),
                seq($.kw_for, $.kw_each, $.kw_row, optional($._referencing_clause)),
                $._referencing_clause,
            )),
            optional($._trigger_edition_clause),
            optional($._trigger_ordering_clause),
            optional($._enable_disable),
            $._trigger_body,
        ),
        _trigger_when_condition: $ => prec.right(2, seq(
            BRACKET_LEFT,
            $.expression,
            BRACKET_RIGHT,
        )),
        _simple_dml_trigger: $ => seq(
            choice($.kw_before, $.kw_after),
            $._dml_event_clause_full,
            // FOR EACH ROW is implicit for INSTEAD OF triggers -- optional;
            // both clause orders allowed
            optional(choice(
                seq(optional($._referencing_clause), $.kw_for, $.kw_each, $.kw_row),
                seq($.kw_for, $.kw_each, $.kw_row, optional($._referencing_clause)),
                $._referencing_clause,
            )),
            optional($._trigger_edition_clause),
            optional($._trigger_ordering_clause),
            optional($._enable_disable),
            optional(seq($.kw_when, $._trigger_when_condition)),
            $._trigger_body,
        ),
        _dml_event_clause_full: $ => seq(
            $._dml_event_element,
            repeat(seq($.kw_or, $._dml_event_element)),
            $.kw_on,
            $.referenced_element
        ),

        _dml_event_element: $ => choice(
            seq($.kw_update, $.kw_of, field("column", $.identifier), repeat(seq(COMMA, field("column", $.identifier)))),
            seq($.kw_insert),
            seq($.kw_delete),
            seq($.kw_update)
        ),
        _compound_trigger_body: $ => seq(
            $.kw_compound,
            $.kw_trigger,
            repeat($._declare_section_element),
            $._timing_point_section,
        ),
        _timing_point_section: $ => seq(
            $._timing_point,
            $.kw_is,
            $.kw_begin,
            repeat1($.statement),
            optional($.exception_block),
            $.end_obj_named,
        ),
        _timing_point: $ => seq(
            $._before_after_instead_of,
            choice($.kw_statement, seq($.kw_each, $.kw_row)),
        ),
        _trigger_body: $ => choice(
            $.plsql_block,
            // TODO CALL
        ),
        _before_after_instead_of: $ => choice(
            $.kw_before,
            $.kw_after,
            seq($.kw_instead, $.kw_of),
        ),
        _nested_table: $ => seq(
            $.kw_nested,
            $.kw_table,
            $.referenced_element,
            $.kw_of,
        ),
        _trigger_ordering_clause: $ => seq(
            choice($.kw_follows, $.kw_precedes),
            $.referenced_element_repeat,
        ),
        _trigger_edition_clause: $ => seq(
            optional(choice($.kw_forward, $.kw_reverse)),
            $.kw_crossedition,
        ),
        _referencing_clause: $ => seq(
            $.kw_referencing,
            repeat1(
                seq(
                    choice($.kw_old, $.kw_new, $.kw_parent),
                    $.kw_as,
                    $.identifier,
                ),
            ),
        ),
        _condition_bracket: $ => seq(
            BRACKET_LEFT,
            $._condition,
            BRACKET_RIGHT,
        ),
        _condition: $ => $.expression,

        default_collation_clause: $ => seq(
            $.kw_default,
            $.kw_collation,
            choice(
                $.kw_using_nls_comp,
            )
        ),
        invoker_rights_clause: $ => seq(
            $.kw_authid,
            choice(
                $.kw_current_user,
                $.kw_definer,
            )
        ),

        result_cache_clause: $ => seq(
            $.kw_result_cache,
            optional(
                seq(
                    $.kw_relies_on,
                    BRACKET_LEFT,
                    $.identifier_list_repeat,
                    BRACKET_RIGHT,
                ),
            ),
        ),
        parallel_enable_clause: $ => seq(
            $.kw_parallel_enable,
            optional(
                seq(
                    BRACKET_LEFT,
                    $.kw_partition,
                    $.identifier,
                    $.kw_by,
                    choice(
                        $.kw_any,
                        seq($.kw_value, BRACKET_LEFT, $.identifier, BRACKET_RIGHT,),
                        seq(choice($.kw_hash, $.kw_range), BRACKET_LEFT, $.identifier, BRACKET_RIGHT, optional($.streaming_clause)),
                    ),
                    BRACKET_RIGHT,
                ),
            ),
        ),
        streaming_clause: $ => seq(
            choice($.kw_order, $.kw_cluster),
            $.expression,
            $.kw_by,
            BRACKET_LEFT,
            repeat1($.identifier_list_repeat),
            BRACKET_RIGHT,
        ),
        accessible_by_clause: $ => seq(
            $.kw_accessible,
            $.kw_by,
            BRACKET_LEFT,
            $.accessor,
            repeat(
                seq(COMMA, $.accessor),
            ),
            BRACKET_RIGHT,
        ),
        accessor: $ => seq(
            optional($._unit_kind),
            $.referenced_element,
        ),
        _unit_kind: $ => choice(
            $.kw_function,
            $.kw_procedure,
            $.kw_package,
            $.kw_trigger,
            $.kw_type,
        ),
        reuse_settings: $ => seq(
            $.kw_reuse,
            $.kw_settings,
        ),
        _schema: $ => seq(
            field("schema_name", $.identifier),
            POINT,
        ),
        referenced_element: $ => seq(
            optional($._schema),
            choice(
                $._referenced_element_parent,
                $._referenced_element_name,
                $._referenced_element_multi,
            ),
        ),
        // left recursion instead of repeat1: the aux rule tree-sitter builds
        // for repeat1 does not inherit associativity, capping chains at three
        // segments (a.b.c.d failed while a.b.c.count parsed)
        _referenced_element_multi: $ => prec.left(3, seq(
            choice(
                seq(field("ref_name_parent", $.identifier),
                    POINT,
                    field("ref_name", $.identifier)),
                $._referenced_element_multi,
            ),
            POINT,
            $.identifier,
        )),
        _referenced_element_parent: $ => prec(2,
            seq(field("ref_name_parent", $.identifier),
                POINT,
                field("ref_name", $.identifier),
            ),
        ),
        _referenced_element_subname: $ => seq(
            field("ref_name_sub", $.identifier),
        ),
        _referenced_element_name: $ => seq(
            field("ref_name", $.identifier),
        ),
        byte_char: $ => choice(
            $.kw_byte,
            $.kw_char,
        ),
        _is_as: $ => choice(
            $.kw_is,
            $.kw_as,
        ),
        end_obj: $ => seq(
            $.kw_end,
        ),
        end_obj_named: $ => seq(
            $.kw_end,
            optional($.identifier),
            SEMICOLON,
        ),
        _declare_section_element: $ => choice(
            $._item_list_1,
            $._item_list_ext,
        ),
        _item_list_1: $ => choice(
            $.function_declaration,
            $.procedure_declaration,
            $._type_definition,
            $.cursor_definition, // covers declaration and definition forms
            $.item_declaration,
            $.exception_declaration,
            $.pragma_declaration, 
        ),
        _item_list_ext: $ => choice(
            $.function_definition,
            $.procedure_definition,
        ),
        create_obj: $ => choice(
            // CREATE OR REPLACE
            seq($.kw_create, $.kw_or, $.kw_replace),
            // plain CREATE
            $.kw_create,
        ),
        _subprogram_specifiers: $ => repeat1(
            choice($.kw_member, $.kw_static, $.kw_map, $.kw_order,
                   $.kw_constructor, $.kw_overriding, $.kw_final,
                   $.kw_instantiable)
        ),
        procedure_definition: $ => prec(1, seq(
            optional($._subprogram_specifiers),
            $.kw_procedure,
            field("prc_name", $.identifier),
            optional($.parameter_declaration),
            repeat($._procedure_properties),
            $._is_as,
            choice(
                seq($.call_spec_ext, SEMICOLON),
                seq(optional(repeat($._declare_section_element)), $.body)
            )
        )),
        procedure_declaration: $ => seq(
            $.kw_procedure,
            field("prc_name", $.identifier),
            optional($.parameter_declaration),
            repeat($._procedure_properties),
            optional(seq($._is_as, $.call_spec_ext)), // IS LANGUAGE JAVA ...
            SEMICOLON,
        ),
        _procedure_properties: $ => choice(
            $.default_collation_clause,
            $.invoker_rights_clause,
            $.accessible_by_clause,
        ),
        function_definition: $ => prec(1, seq(
            optional($._subprogram_specifiers),
            $.kw_function,
            field("fnc_name", $.identifier),
            optional($.parameter_declaration),
            $.return_declaration,
            repeat($._function_properties),
            $._is_as,
            choice(
                seq($.call_spec_ext, SEMICOLON),
                seq(optional(repeat($._declare_section_element)), $.body)
            )
        )),
        function_declaration: $ => seq(
            $.kw_function,
            field("fnc_name", $.identifier),
            optional($.parameter_declaration),
            $.return_declaration,
            repeat($._function_properties),
            optional(seq($._is_as, $.call_spec_ext)), // IS LANGUAGE JAVA ...
            SEMICOLON,
        ),
        _function_properties: $ => choice(
            $.kw_deterministic,
            $.kw_pipelined,
            $.kw_parallel_enable,
            $.result_cache_clause, // RESULT_CACHE [RELIES_ON (...)]
        ),
        exception_declaration: $ => seq(
            $.identifier,
            $.kw_exception,
            SEMICOLON,
        ),
        _exception_name: $ => choice(
            $.kw_others,
            $.kw_dup_val_on_index,
            $.referenced_element,
        ),
        exception_handler: $ => seq(
            $.kw_when,
            $._exception_name,
            repeat(seq($.kw_or, $._exception_name)), // WHEN a OR b THEN
            $.kw_then,
            repeat1($.statement),
        ),
        pragma_declaration: $ => seq(
            $.kw_pragma,
            choice(
                seq($.kw_exception_init, BRACKET_LEFT, $.identifier, COMMA, $._literal_number, BRACKET_RIGHT),
                seq($.kw_autonomous_transaction),
                seq($.kw_inline, BRACKET_LEFT, $.identifier, COMMA, $.literal_string, BRACKET_RIGHT),
                // any other pragma: NAME [(arg, ...)]
                seq(
                    $.identifier,
                    optional(seq(
                        BRACKET_LEFT,
                        $.expression,
                        repeat(seq(COMMA, $.expression)),
                        BRACKET_RIGHT,
                    )),
                ),
            ),
            SEMICOLON,
        ),
        _item_declaration_identifier: $ => prec.right(10, choice(
            seq($.identifier, repeat(seq(UNDERSCORE, $.identifier))),
            $.identifier,
        )),
        item_declaration: $ => seq(
            $._item_declaration_identifier,
            optional($.kw_constant),
            $.datatype,
            optional($._not_null),
            optional($.default_expression),
            SEMICOLON,
        ),
        plsql_block: $ => prec(1, seq(
            // declare section may be empty: DECLARE BEGIN ... END;
            optional(seq($.kw_declare, repeat($._declare_section_element))),
            $.kw_begin,
            repeat1($.statement),
            optional($.exception_block),
            $.end_obj_named,
        )),
        body: $ => seq(
            $.kw_begin,
            repeat1($.statement),
            optional($.exception_block),
            $.end_obj_named,
        ),
        exception_block: $ => seq(
            $.kw_exception,
            repeat1($.exception_handler),
        ),
        statement: $ => choice(
            seq(optional($.label), $._statement_element, SEMICOLON),
            // nested anonymous block: END [name]; already carries the semicolon
            seq(optional($.label), $.plsql_block),
        ),
        _statement_element: $ => choice(
            prec(8, $.assignment_statement),
            $.if_statement,
            $.basic_loop_statement,
            $.case_statement,
            $.close_statement,
            $.referenced_element_point_method_call,
            $.continue_statement,
            $.execute_immediate,
            $.exit_statement,
            $.fetch_statement,
            $.for_loop_statement,
            $.forall_statement,
            $.goto_statement,
            $.null_statement,
            $.open_statement,
            $.open_for_statement,
            $.pipe_row_statement,
            $._object_cast_call, // (self as Super).proc();
            $.ref_call,
            $.referenced_element,
            $.raise_statement,
            $.return_statement,
            $._sql_statements,
            $.while_loop_statement,
            $.raise_application_error_statement, 

        ),
        assignment_statement: $ => seq(
            $._assignment_statement_target,
            ASSIGNMENT,
            $.expression,
        ),
        _assignment_statement_target: $ => choice(
            $.referenced_element,
            $.host_variable,
            $.ref_call, // coll(expr) / coll(expr).field / f(x).g(y).field
            $.correlation_variable,
        ),
        collection_variable: $ => seq(
            $.referenced_element,
            choice(
                $._index,
                seq(BRACKET_LEFT, $.referenced_element, BRACKET_RIGHT),
            ),
        ),
        label: $ => seq(
            LABEL_START,
            $.identifier,
            LABEL_END
        ),
        basic_loop_statement: $ => seq(
            $.kw_loop,
            repeat1($.statement),
            $.kw_end,
            $.kw_loop,
            optional($.identifier), // END LOOP label_name
        ),
        case_statement: $ => choice(
            $._simple_case_statement,
            $._searched_case_statement,
        ),
        _searched_case_statement: $ => seq(
            $.kw_case,
            repeat1(
                seq($.kw_when, $.expression, $.kw_then, repeat1($.statement)),
            ),
            optional(
                seq($.kw_else, repeat1($.statement)),
            ),
            $.kw_end,
            $.kw_case,
            optional($.label),
        ),
        _simple_case_statement: $ => seq(
            $.kw_case,
            $.expression,
            repeat1(
                seq($.kw_when, $.expression, $.kw_then, repeat1($.statement)),
            ),
            optional(
                seq($.kw_else, repeat1($.statement)),
            ),
            $.kw_end,
            $.kw_case,
            optional($.label),
        ),
        close_statement: $ => seq(
            $.kw_close,
            choice(
                $.referenced_element,
                $.host_variable,
            ),
        ),
        continue_statement: $ => seq(
            $.kw_continue,
            optional($.identifier), // CONTINUE loop_label
            optional(seq($.kw_when, $.expression)),
        ),
        fetch_statement: $ => seq(
            $.kw_fetch,
            $._assignment_statement_target,
            $._into_and_bulk_clause,
        ),
        exit_statement: $ => seq(
            $.kw_exit,
            optional($.identifier), // EXIT loop_label
            optional(seq($.kw_when, $.expression)),
        ),
        return_statement: $ => seq(
            $.kw_return,
            optional($.expression),
        ),
        raise_statement: $ => seq(
            $.kw_raise,
            optional($.referenced_element), // optional
        ),
        raise_application_error_statement: $ => seq(
            $.kw_raise_application_error,
            BRACKET_LEFT,
            $.expression, // error number may be a constant reference
            COMMA,
            $.expression,
            optional(seq(COMMA, choice($.kw_true, $.kw_false))),
            BRACKET_RIGHT,
        ),
        pipe_row_statement: $ => seq(
            $.kw_pipe,
            $.kw_row,
            BRACKET_LEFT,
            $.expression, // e.g. PIPE ROW (vTab(i))
            BRACKET_RIGHT,
        ),
        null_statement: $ => seq(
            $.kw_null,
        ),
        _sql_statements: $ => choice(
            $.sql_statement_commit,
            $.sql_statement_rollback,
            $.sql_statement_savepoint,
            $.sql_statement_set_transaction,
            $.sql_statement_lock_table,
            $.sql_statement_select,
            $.sql_statement_delete,
            $.sql_statement_update,
            $.sql_statement_insert,
            $.sql_statement_merge,
        ),
        sql_statement_lock_table: $ => seq(
            $.kw_lock,
            $.kw_table,
            $.referenced_element,
            optional($._partition_extension_clause),
            $.kw_in,
            repeat1($.identifier),
            $.kw_mode,
            choice(
                $.kw_nowait,
                seq($.kw_wait, $.number),
            ),
        ),
        sql_statement_rollback: $ => seq(
            $.kw_rollback,
            optional($.kw_work),
            optional(
                choice(
                    seq($.kw_to, optional($.kw_savepoint), $.identifier),
                    seq($.kw_comment, $.literal_string),
                ),
            ),
        ),
        sql_statement_commit: $ => seq(
            $.kw_commit,
            optional($.kw_work),
            optional(
                choice(
                    seq($.kw_force, $.literal_string, optional(seq(COMMA, $.number))),
                    seq($.kw_comment, $.literal_string,
                        optional(seq($.kw_write, optional(choice($.kw_wait, $.kw_nowait)),
                            optional(choice($.kw_immediate, $.kw_batch))),
                        ),
                    ),
                ),
            ),
        ),
        sql_statement_savepoint: $ => seq(
            $.kw_savepoint,
            $.identifier,
        ),
        sql_statement_set_transaction: $ => seq(
            $.kw_set,
            $.kw_transaction,
            repeat(
                choice(
                    seq($.kw_read, choice($.kw_only, $.kw_write)),
                    seq($.kw_isolation, $.kw_level, choice($.kw_serializable, seq($.kw_read, $.kw_commtted))),
                    seq($.kw_use, $.kw_rollback, $.kw_segment, $.identifier),
                ),
            ),
            optional(seq($.kw_name, $.identifier)),
        ),
        while_loop_statement: $ => seq(
            $.kw_while,
            $.expression,
            $.kw_loop,
            repeat1($.statement),
            $.kw_end,
            $.kw_loop,
            optional($.identifier), // END LOOP label_name
        ),
        for_loop_statement: $ => seq(
            $.kw_for,
            $.iterator,
            $.kw_loop,
            repeat1($.statement),
            $.kw_end,
            $.kw_loop,
            optional($.identifier), // END LOOP label_name
        ),
        // FORALL i IN lo .. hi | INDICES OF t [BETWEEN lo AND hi] | VALUES OF t
        //   [SAVE EXCEPTIONS] <single DML statement>
        forall_statement: $ => seq(
            $.kw_forall,
            $.identifier,
            $.kw_in,
            choice(
                seq($.expression, RANGE, $.expression),
                seq($.kw_indices, $.kw_of, $.referenced_element,
                    optional(seq($.kw_between, $.expression, $.kw_and, $.expression))),
                seq($.kw_values, $.kw_of, $.referenced_element),
            ),
            optional(seq($.kw_save, $.kw_exceptions)),
            choice(
                $.sql_statement_insert,
                $.sql_statement_update,
                $.sql_statement_delete,
                $.sql_statement_merge,
                $.execute_immediate,
            ),
        ),
        iterator: $ => seq(
            $._iterand_decl,
            optional(seq(COMMA, $._iterand_decl)),
            $.kw_in,
            $._iterator_ctl_seq,
        ),
        _iterand_decl: $ => seq(
            $.identifier,
            optional(choice($.kw_mutable, $.kw_immutable)),
        ),
        _iterator_ctl_seq: $ => seq(
            $._qual_iteration_ctl,
            optional(seq(COMMA, $._qual_iteration_ctl)),
        ),
        _qual_iteration_ctl: $ => seq(
            optional($.kw_reverse),
            $._iteration_control,
            optional($._pred_clause_seq),
        ),
        _iteration_control: $ => choice(
            // TODO
            $._iteration_stepped_control,
            $._single_expression_control,
            $._xy_of_control,
        ),
        _iteration_stepped_control: $ => seq(
            $.expression,
            RANGE,
            $.expression,
            optional(seq($.kw_by, $._literal_number)),
        ),
        _xy_of_control: $ => seq(
            choice($.kw_indices, $.kw_values, $.kw_pairs),
            $.kw_of,
            $.expression,
        ),
        _single_expression_control: $ => seq(
            optional($.kw_repeat),
            $.expression,
        ),
        _pred_clause_seq: $ => choice(
            seq($.kw_while, $.expression),
            seq($.kw_when, $.expression),
            seq($.kw_while, $.expression, $.kw_when, $.expression),
        ),
        if_statement: $ => seq(
            $.kw_if,
            $.expression,
            $.kw_then,
            repeat1($.statement),
            repeat(seq($.kw_elsif, $.expression, $.kw_then, repeat1($.statement))),
            optional(seq($.kw_else, repeat1($.statement))),
            prec(4, $.end_if),
        ),
        end_if: $ => seq(
            $.kw_end,
            $.kw_if,
        ),
        goto_statement: $ => seq(
            $.kw_goto,
            $.identifier, // GOTO label_name (no << >> here)
        ),
        open_statement: $ => seq(
            $.kw_open,
            $.referenced_element,
            optional($.parameter),
        ),
        open_for_statement: $ => seq(
            $.kw_open,
            $._assignment_statement_target,
            $.kw_for,
            choice(
                $.sql_statement_select,
                $.expression, // dynamic SQL string
            ),
            optional($._using_clause),
        ),
        execute_immediate: $ => seq(
            $.kw_execute,
            $.kw_immediate,
            $.expression,
            optional(
                choice(
                    seq($._using_clause, optional($._dynamic_returning_clause)),
                    $._dynamic_returning_clause,
                    seq($._into_and_bulk_clause, optional($._using_clause)),
                ),
            ),
        ),
        _error_logging_clause: $ => seq(
            $.kw_log,
            $.kw_errors,
            optional(seq($.kw_into, $.referenced_element)),
            optional(seq(BRACKET_LEFT, $.expression, BRACKET_RIGHT)),
            optional($._modified_external_table_properties_reject),
        ),
        _returning_clause: $ => seq(
            choice(
                $.kw_return,
                $.kw_returning,
            ),
            $.expression,
            repeat(seq(COMMA, $.expression)),
            optional(seq($.kw_bulk, $.kw_collect)), // RETURNING x BULK COLLECT INTO t
            $.kw_into,
            $.referenced_element,
            repeat(seq(COMMA, $.referenced_element)),
        ),
        _dynamic_returning_clause: $ => seq(
            choice(
                $.kw_return,
                $.kw_returning,
            ),
            $._into_and_bulk_clause,
        ),
        _using_clause: $ => seq(
            $.kw_using,
            $._using_clause_element,
            repeat(
                seq(COMMA, $._using_clause_element),
            ),
        ),
        _using_clause_element: $ => seq(
            optional(choice(
                seq($.kw_in, $.kw_out),
                $.kw_in,
                $.kw_out,
            )),
            $.expression,
        ),
        // one rule covers cursor declarations AND definitions
        cursor_definition: $ => seq(
            $.kw_cursor,
            $.identifier,
            optional($.cursor_declaration_parameters),
            optional(seq($.kw_return, $._cursor_declaration_return_datatype)),
            choice(
                SEMICOLON, // forward/spec declaration
                seq($.kw_is, $.sql_statement_select, SEMICOLON),
            ),
        ),
        _cursor_declaration_return_datatype: $ => choice(
            $._referenced_datatypes,
            $.identifier,
        ),
        cursor_declaration_parameters: $ => seq(
            BRACKET_LEFT,
            $.cursor_declaration_parameter,
            repeat(seq(COMMA, $.cursor_declaration_parameter)),
            BRACKET_RIGHT,
        ),
        cursor_declaration_parameter: $ => seq(
            $.identifier,
            optional($.kw_in),
            $.datatype,
            optional($.default_expression),
        ),
        _type_definition: $ => choice(
            $.type_definition_sub,
            $.type_definition_ref_cursor,
            $.type_definition_record,
            $.type_definition_collection,
        ),
        type_definition_collection: $ => seq(
            $.kw_type,
            field("type_collection_name", $.identifier),
            $.kw_is,
            choice(
                $.type_definition_assoc_array,
                $.type_definition_nested_table,
                $.type_definition_varray,
            ),
            SEMICOLON,
        ),
        type_definition_varray: $ => seq(
            choice(
                $.kw_varray,
                seq(
                    optional($.kw_varying),
                    $.kw_array,
                ),
            ),
            $._size,
            $.kw_of,
            choice(
                seq($.datatype, optional($._not_null)),
                seq(BRACKET_LEFT, $.datatype, optional($._not_null), BRACKET_RIGHT),
            ),
            optional(seq($.kw_not, $.kw_persistable)),
        ),
        type_definition_nested_table: $ => seq(
            $.kw_table,
            $.kw_of,
            choice(
                seq($.datatype, optional($._not_null)),
                seq(BRACKET_LEFT, $.datatype, optional($._not_null), BRACKET_RIGHT),
            ),
            optional(seq($.kw_not, $.kw_persistable)),
        ),
        type_definition_assoc_array: $ => seq(
            $.kw_table,
            $.kw_of,
            $.datatype,
            optional($._not_null),
            $.kw_index,
            $.kw_by,
            $.type_definition_assoc_array_datatypes,
        ),
        type_definition_assoc_array_datatypes: $ => prec(2, choice(
            $.kw_pls_integer,
            $.kw_binary_integer,
            $.kw_long, // this LONG takes precedence in INDEX BY context
            $._referenced_datatypes,
            $._referenced_element_percent_type, // INDEX BY tab.col%TYPE
            seq(
                choice(
                    $.kw_varchar2,
                    $.kw_varchar,
                    $.kw_string,
                ),
                $._size_byte_char,
            ),
        )),
        type_definition_record: $ => seq(
            $.kw_type,
            field("type_rec_name", $.identifier),
            $.kw_is,
            $.kw_record,
            BRACKET_LEFT,
            $.field_definition,
            repeat(seq(COMMA, $.field_definition)),
            BRACKET_RIGHT,
            SEMICOLON,
        ),
        field_definition: $ => seq(
            $.identifier,
            $.datatype,
            optional($._not_null),
            optional($.default_expression),
        ),
        type_definition_ref_cursor: $ => seq(
            $.kw_type,
            field("ref_cursor_name", $.identifier),
            $.kw_is,
            $.kw_ref,
            $.kw_cursor,
            optional($.type_definition_ref_cursor_return),
            SEMICOLON,
        ),
        type_definition_ref_cursor_return: $ => seq(
            $.kw_return,
            choice(
                $._referenced_datatypes,
                $.referenced_element,
            ),
        ),
        type_definition_sub: $ => seq(
            $.kw_subtype,
            field("subtype_name", $.identifier),
            $.kw_is,
            $.datatype,
            repeat(
                choice(
                    $.type_range,
                    $.character_set,
                ),
            ),
            optional($._not_null),
            SEMICOLON,
        ),
        character_set: $ => seq(
            $.kw_character,
            $.kw_set,
            $.literal_string,
        ),
        type_range: $ => seq(
            $.kw_range,
            $._literal_number,
            RANGE,
            $._literal_number,
        ),
        _is_null_or_is_not_null: $ => choice(
            $._is_null,
            $._is_not_null,
        ),
        _is_null: $ => seq(
            $.kw_is,
            $.kw_null,
        ),
        _is_not_null: $ => seq(
            $.kw_is,
            $.kw_not,
            $.kw_null,
        ),
        _not_null: $ => seq(
            $.kw_not,
            $.kw_null,
        ),
        // collection IS [NOT] EMPTY
        _is_empty: $ => seq(
            $.kw_is,
            optional($.kw_not),
            $.kw_empty,
        ),
        // obj IS [NOT] OF (TypeName [, TypeName ...])
        _is_of: $ => seq(
            $.kw_is,
            optional($.kw_not),
            $.kw_of,
            BRACKET_LEFT,
            $.referenced_element,
            repeat(seq(COMMA, $.referenced_element)),
            BRACKET_RIGHT,
        ),
        // expr IS [NOT] JSON [FORMAT JSON] [STRICT|LAX] [ALLOW|DISALLOW SCALARS]
        // prec.right: trailing modifiers bind to IS JSON, not the enclosing
        // json_table argument list
        _is_json: $ => prec.right(seq(
            $.kw_is,
            optional($.kw_not),
            $.kw_json,
            optional(seq($.kw_format, $.kw_json)),
            optional(choice($.kw_strict, $.kw_lax)),
            optional(seq(choice($.kw_allow, $.kw_disallow), $.kw_scalars)),
        )),
        expression: $ => choice(
            prec(4, $._expression_element),
            // window_function lives in _expression_base_elements so it also
            // works as a comparison / arithmetic operand
        ),
        _expression_element: $ => choice(
            // rule order matters for binary operator parsing
            prec(2, $._expression_base_boolean),
            prec(5, $._expression_base_elements),
            prec(3, $._expression_base_operator_not_boolean),
            prec(1, $._expression_base_case),
            prec(6, seq(BRACKET_LEFT, $.expression, BRACKET_RIGHT)),  // parenthesized expression, high precedence
        ),
        _expression_base_elements: $ => choice(
            prec(8, $.ref_call),
            prec(7, $.referenced_element_point_method_call),
            prec(6, $._referenced_element_percent_method_call),
            prec(5, $.referenced_element),
            prec(4, $.aggregate_function_call),
            prec(3, $.scalar_subquery),
            prec(2, $._literal),
            prec(1, $._literal_list_multi),
            prec(-1, $.correlation_variable), // low precedence
            prec(-2, $.placeholder),
            // window functions as arithmetic/comparison operands
            prec(7, $.window_function),
            prec(9, seq(BRACKET_LEFT, $.expression, BRACKET_RIGHT)),  // parenthesized expression, high precedence
            $._sql_percent_attributes, 
            // Oracle outer join marker: col(+)
            prec(6, seq($.referenced_element, $.outer_join_marker)),
            // hierarchical query: PRIOR col
            prec(7, seq($.kw_prior, $.referenced_element)),
            // CAST(expr AS type)
            prec(8, seq($.kw_cast, BRACKET_LEFT, $.expression,
                $.kw_as, $.datatype, BRACKET_RIGHT)),
            // CASE expression as operand: a + CASE ... END
            $._expression_base_case,
            // XMLELEMENT / XMLATTRIBUTES with [AS "alias"] argument items
            prec(8, seq($.kw_xmlelement, BRACKET_LEFT, $.xml_passing_item,
                repeat(seq(COMMA, $.xml_passing_item)), BRACKET_RIGHT)),
            prec(8, seq($.kw_xmlattributes, BRACKET_LEFT, $.xml_passing_item,
                repeat(seq(COMMA, $.xml_passing_item)), BRACKET_RIGHT)),
            // XMLAGG(expr [ORDER BY ...])[.extract(...).getClobVal()...]
            prec.right(8, seq($.kw_xmlagg, BRACKET_LEFT, $.expression,
                optional($.order_by_clause), BRACKET_RIGHT,
                repeat(seq(POINT, $.referenced_element, optional($.parameter))))),
            // (expr AS type).method(...) -- object member dispatch cast
            $._object_cast_call,
            // TREAT(expr AS type)[.method()...]
            prec.right(8, seq($.kw_treat, BRACKET_LEFT, $.expression,
                $.kw_as, $.datatype, BRACKET_RIGHT,
                repeat(seq(POINT, $.referenced_element, optional($.parameter))))),
            // LISTAGG(expr [, sep [ON OVERFLOW ERROR|TRUNCATE [ind]
            //   [WITH|WITHOUT COUNT]]]) [WITHIN GROUP (ORDER BY ...)]
            // (no DISTINCT support -- too expensive, see readme)
            prec.right(9, seq($.kw_listagg, BRACKET_LEFT, $.expression,
                optional(seq(COMMA, $.expression,
                    optional(seq($.kw_on, $.kw_overflow,
                        choice($.kw_error, $.kw_truncate),
                        optional($.expression),
                        optional(seq(choice($.kw_with, $.kw_without), $.kw_count)))))),
                BRACKET_RIGHT,
                optional(seq($.kw_within, $.kw_group,
                    BRACKET_LEFT, $.order_by_clause, BRACKET_RIGHT)))),
            // COLLECT([DISTINCT] expr [ORDER BY ...])
            prec(8, seq($.kw_collect, BRACKET_LEFT,
                optional(choice($.kw_distinct, $.kw_unique)),
                $.expression, optional($.order_by_clause), BRACKET_RIGHT)),
            // any-aggregate analytic form: fn(args) OVER (partition/order)
            prec.right(9, seq(
                choice($.ref_call, $.aggregate_function_call),
                $.kw_over,
                BRACKET_LEFT,
                optional($.partition_by_clause),
                optional($.order_by_clause),
                optional($.windowing_clause),
                BRACKET_RIGHT)),
            // EXTRACT(YEAR|...|SECOND FROM expr) and the XMLType method
            // extract(doc, 'xpath')[.getStringVal()...]
            prec.right(8, seq($.kw_extract, BRACKET_LEFT,
                choice(
                    seq(choice($.kw_year, $.kw_month, $.kw_day,
                               $.kw_hour, $.kw_minute, $.kw_second),
                        $.kw_from, $.expression),
                    seq($.expression, repeat(seq(COMMA, $.expression))),
                ),
                BRACKET_RIGHT,
                repeat(seq(POINT, $.referenced_element, optional($.parameter))))),
            // aggregate WITHIN GROUP (ORDER BY ...): listagg, rank, ...
            prec.right(9, seq($.ref_call, $.kw_within, $.kw_group,
                BRACKET_LEFT, $.order_by_clause, BRACKET_RIGHT)),
            // unary sign before a parenthesized or other expression
            prec(7, seq(choice(PLUS, MINUS), $._expression_base_elements)),

            // conditional compilation inquiry directive: $$plsql_line, $$name
            $.inquiry_directive,
            // RANK / ROW_NUMBER used as plain column names (WHERE rank = 1)
            prec(-3, alias(choice($.kw_rank, $.kw_row_number), $.identifier)),
            // aggregate KEEP (DENSE_RANK FIRST|LAST ORDER BY ...)
            prec.right(9, seq(
                choice($.ref_call, $.aggregate_function_call),
                $.kw_keep,
                BRACKET_LEFT,
                $.kw_dense_rank,
                choice($.kw_first, $.kw_last),
                $.order_by_clause,
                BRACKET_RIGHT)),
            // ANSI datetime literals: DATE '1900-01-01', TIMESTAMP '...'
            prec(8, seq(choice($.kw_date, $.kw_timestamp), $.literal_string)),
            // interval literals: INTERVAL '1' SECOND, INTERVAL '99' YEAR [TO MONTH]
            prec(8, seq($.kw_interval, $.literal_string,
                choice($.kw_year, $.kw_month, $.kw_day,
                       $.kw_hour, $.kw_minute, $.kw_second),
                optional(seq($.kw_to,
                    choice($.kw_month, $.kw_hour, $.kw_minute, $.kw_second))))),
            // hierarchical CONNECT_BY_ROOT col
            prec(7, seq($.kw_connect_by_root, $.referenced_element)),
            // collection constructor from a subquery: MULTISET(SELECT ...)
            prec(8, seq($.kw_multiset, BRACKET_LEFT, $._subquery, BRACKET_RIGHT)),
            // NEW as correlation/alias qualifier: NEW.column (also in trigger
            // WHEN clauses, where new needs no colon). kw_new is an external
            // token, so identifiers like newPeriod cannot split; OLD stays
            // unsupported here because internal kw_old would split oldX names.
            prec(8, seq($.kw_new, POINT, $.identifier)),
            // XMLFOREST(expr [AS "alias" | AS EVALNAME expr], ...)
            prec(8, seq($.kw_xmlforest, BRACKET_LEFT, $.xml_passing_item,
                repeat(seq(COMMA, $.xml_passing_item)), BRACKET_RIGHT)),
            // constructor invocation: NEW Type(...)
            prec(8, seq($.kw_new, choice($.ref_call, $.referenced_element))),
            // TRIM([BOTH|LEADING|TRAILING] x [FROM y])
            prec(8, seq($.kw_trim, BRACKET_LEFT,
                optional(choice($.kw_both, $.kw_leading, $.kw_trailing)),
                $.expression,
                optional(seq($.kw_from, $.expression)), BRACKET_RIGHT)),

        ),
        // (self AS SuperType).method(...) -- usable as expression or statement
        _object_cast_call: $ => prec(9, seq(
            BRACKET_LEFT, $.expression, $.kw_as, $.datatype, BRACKET_RIGHT,
            repeat(seq(POINT, $.referenced_element, optional($.parameter))),
        )),
        _expression_base_operator_not_boolean: $ => prec.left(seq(
            $._expression_base_elements,
            repeat1(
                seq(
                    $._expression_operator_not_boolean,
                    $._expression_base_elements,
                ),
            ),
        )),
        _expression_base_case: $ => choice(
            $.expression_base_case_search,
            $.expression_base_case_simple,
        ),
        // ranking functions; aggregates + OVER parse via the generic element
        window_function: $ => prec.right(2, seq(
            choice(
                $.kw_row_number,
                $.kw_rank,
                $.kw_dense_rank,
            ),
            BRACKET_LEFT,
            optional(seq(
                optional(choice($.kw_distinct, $.kw_unique, $.kw_all)),
                choice($.expression, $.kw_asterisk),
            )),
            BRACKET_RIGHT,
            $.kw_over,
            BRACKET_LEFT,
            optional($.partition_by_clause),
            optional($.order_by_clause),
            optional($.windowing_clause),
            BRACKET_RIGHT,
        )),

        partition_by_clause: $ => seq(
            $.kw_partition,
            $.kw_by,
            $.expression,
            repeat(seq(COMMA, $.expression)),
        ),

        windowing_clause: $ => choice(
            seq($.kw_rows, choice(
                seq($.kw_between, choice($.kw_unbounded, $.kw_current, $.expression),
                    choice($.kw_preceding, $.kw_following),
                    $.kw_and,
                    choice($.kw_unbounded, $.kw_current, $.expression),
                    choice($.kw_preceding, $.kw_following)),
                seq(choice($.kw_unbounded, $.kw_current, $.expression),
                    choice($.kw_preceding, $.kw_following))
            )),
            seq($.kw_range, choice(
                seq($.kw_between, choice($.kw_unbounded, $.kw_current, $.expression),
                    choice($.kw_preceding, $.kw_following),
                    $.kw_and,
                    choice($.kw_unbounded, $.kw_current, $.expression),
                    choice($.kw_preceding, $.kw_following)),
                seq(choice($.kw_unbounded, $.kw_current, $.expression),
                    choice($.kw_preceding, $.kw_following))
            ))
        ),
        expression_base_case_search: $ => seq(
            $.kw_case,
            repeat1(
                seq($.kw_when, $.expression, $.kw_then, $.expression),
            ),
            optional(
                seq($.kw_else, $.expression),
            ),
            $.kw_end,
        ),
        expression_base_case_simple: $ => seq(
            $.kw_case,
            $.expression,
            repeat1(
                seq($.kw_when, $.expression, $.kw_then, $.expression),
            ),
            optional(
                seq($.kw_else, $.expression),
            ),
            $.kw_end,
        ),
        _expression_base_boolean: $ => prec.left(
            seq(
                optional($.kw_not),
                $._expression_base_boolean_elements,
                repeat($._expression_base_boolean_repeat),
            ),
        ),
        _expression_base_boolean_elements: $ => choice(
            seq(
                // comparison operands may be arithmetic: a - b <= c
                choice(
                    $._expression_base_operator_not_boolean,
                    $._expression_base_elements,
                    // CASE WHEN row_number() OVER (...) = 1 THEN ...
                    $.window_function,
                ),
                choice(
                    $._expression_base_boolean_operator,
                    $._expression_base_boolean_between,
                    $._expression_base_boolean_in,
                    $._expression_base_boolean_like,
                    $._expression_base_boolean_member_of,
                    $._is_null_or_is_not_null,
                    $._is_empty,
                    $._is_json,
                    $._is_of,
                ),
            ),
            $._conditional_predicate,
            $._expression_base_boolean_tuple_in,
            $._object_cast_call, // (self as Super).isEnabled AND ...
            choice($.kw_true, $.kw_false), // NOT true, f(x, not true)
            $.ref_call,
            $.referenced_element,
            $._referenced_element_percent_method_call,
            $._sql_percent_attributes,
            // [NOT] EXISTS (subquery) -- NOT comes from _expression_base_boolean
            seq($.kw_exists, $.scalar_subquery),
            prec(1, $.correlation_variable), // raised precedence
            // parenthesized boolean group: a AND (b IS NULL OR c >= d)
            prec(9, seq(BRACKET_LEFT, $.expression, BRACKET_RIGHT)),
        ),
        _expression_base_boolean_repeat: $ => seq(
            choice(
                $.kw_and,
                $.kw_or,
            ),
            $._expression_base_boolean,
        ),
        _expression_base_boolean_operator: $ => seq(
            $._expression_operator_boolean,
            choice(
                $._expression_base_operator_not_boolean,
                $._expression_base_elements,
                // quantified comparison: x <= ALL (subquery), y < ANY (...)
                seq(choice($.kw_any, $.kw_all), $.scalar_subquery),
            ),
        ),
        _expression_base_boolean_in: $ => seq(
            optional($.kw_not),
            $.kw_in,
            choice(
                $.expression,
                // IN (a, b, ...) value list
                seq(
                    BRACKET_LEFT,
                    $.expression,
                    repeat1(seq(COMMA, $.expression)),
                    BRACKET_RIGHT,
                ),
            ),
        ),
        // (a, b) IN (SELECT ...) / (a, b) = (SELECT ...) -- tuple predicates
        _expression_base_boolean_tuple_in: $ => seq(
            BRACKET_LEFT,
            $.expression,
            repeat1(seq(COMMA, $.expression)),
            BRACKET_RIGHT,
            choice(
                seq(optional($.kw_not), $.kw_in, $.expression),
                seq(EQUAL, $.expression),
            ),
        ),
        _expression_base_boolean_like: $ => prec.right(seq(
            optional($.kw_not),
            $.kw_like,
            $.expression,
            optional(seq($.kw_escape, $.expression)),
        )),
        _expression_base_boolean_between: $ => seq(
            optional($.kw_not),
            $.kw_between,
            $.expression,
            $.kw_and,
            $.expression,
        ),
        // x [NOT] MEMBER OF collection
        _expression_base_boolean_member_of: $ => seq(
            optional($.kw_not),
            $.kw_member,
            $.kw_of,
            $._expression_base_elements,
        ),
        _referenced_element_percent_method_call: $ => seq(
            $.referenced_element,
            PERCENT,
            choice(
                $.kw_rowcount,
                $.kw_found,
                $.kw_isopen,
                $.kw_notfound,
            ),
        ),
        _sql_percent_attributes: $ => seq(
            $.kw_sql,
            PERCENT,
            choice(
                $.kw_rowcount,
                $.kw_found,
                $.kw_notfound,
                $.kw_isopen,
                // SQL%BULK_ROWCOUNT(i), SQL%BULK_EXCEPTIONS(i).error_code
                seq(choice($.kw_bulk_rowcount, $.kw_bulk_exceptions),
                    optional(seq(BRACKET_LEFT, $.expression, BRACKET_RIGHT)),
                    repeat(seq(POINT, choice($.kw_count, $.identifier)))),
            ),
        ),
        referenced_element_point_method_call: $ => seq(
            $.referenced_element,
            POINT,
            choice(
                $.kw_count,
                $.kw_delete,
                $.kw_first,
                $.kw_last,
                $.kw_limit,
                $.kw_next,
                $.kw_prior,
                $.kw_exists,
                $.kw_extend,
                $.kw_trim,
            ),
            optional($._index),
        ),
        _conditional_predicate: $ => choice(
            $.kw_inserting,
            $.kw_deleting,
            seq(
                $.kw_updating,
                optional(
                    seq(
                        BRACKET_LEFT,
                        $.literal_string,
                        BRACKET_RIGHT,
                    ),
                ),
            ),
        ),
        return_declaration: $ => seq(
            $.kw_return,
            $.datatype,
        ),

        // =================================================================
        // --- DATATYPE RULES ---
        // =================================================================

        // main datatype rule used in declarations;
        // covers all type categories.
        datatype: $ => choice(
            $._referenced_element_percent_type, // keep high in the choice
            $._referenced_element_percent_rowtype,
            $._oracle_built_in_datatypes,
            $._ansi_supported_datatypes,
            $._user_defined_types,
            $._oracle_supplied_types
        ),
        _referenced_element_percent_type: $ => prec.right(10, seq(
            $.referenced_element,
            $.kw_datatype_type
        )),
        // tab%ROWTYPE / cursor%ROWTYPE
        _referenced_element_percent_rowtype: $ => prec.right(10, seq(
            $.referenced_element,
            $.kw_datatype_rowtype
        )),

        // --- Oracle Built-in Datatypes ---
        _oracle_built_in_datatypes: $ => choice(
            $._character_datatypes,
            $._number_datatypes,
            $._long_and_raw_datatypes,
            $._datetime_datatypes,
            $._large_object_datatypes,
            $._rowid_datatypes,
            $.kw_boolean, 

        ),

        _character_datatypes: $ => choice(
            seq($.kw_char, optional($._size_byte_char)),
            // size optional; (n CHAR|BYTE) length semantics
            seq($.kw_varchar2, optional($._size_byte_char)),
            seq($.kw_nchar, optional($._size)),
            seq($.kw_nvarchar2, optional($._size_byte_char)),
            seq($.kw_string, optional($._size)) // STRING(2)
        ),

        _number_datatypes: $ => prec(2, choice(
            seq($.kw_number, optional($._size_precision_scale)),
            seq($.kw_float, optional($._size)),
            $.kw_binary_float,
            $.kw_binary_double
        )),

        _long_and_raw_datatypes: $ => choice(
            $.kw_long,
            seq($.kw_long, $.kw_raw),
            seq($.kw_raw, optional($._size))
        ),

        _datetime_datatypes: $ => choice(
            $.kw_date,
            seq($.kw_timestamp, optional($._size), optional($._with_local_time_zone)),
            seq($.kw_interval, $.kw_year, optional($._size), $.kw_to, $.kw_month),
            seq($.kw_interval, $.kw_day, optional($._size), $.kw_to, $.kw_second, optional($._size))
        ),

        _large_object_datatypes: $ => choice(
            $.kw_blob,
            $.kw_clob,
            $.kw_nclob,
            $.kw_bfile
        ),

        _rowid_datatypes: $ => choice(
            $.kw_rowid,
            seq($.kw_urowid, optional($._size))
        ),

        // --- ANSI Supported Datatypes ---
        _ansi_supported_datatypes: $ => prec(1, choice(
            seq($.kw_character, optional($.kw_varying), $._size),
            seq(choice($.kw_char, $.kw_nchar), $.kw_varying, $._size),
            seq($.kw_varchar, optional($._size)),
            seq($.kw_national, choice($.kw_character, $.kw_char), optional($.kw_varying), $._size),
            seq(choice($.kw_numeric, $.kw_decimal), optional($._size_precision_scale)),
            choice($.kw_integer, $.kw_int, $.kw_smallint),
            seq($.kw_float, optional($._size)), // this FLOAT variant has lower precedence
            seq($.kw_double, $.kw_precision),
            $.kw_real
        )),

        // --- User-Defined Types ---
        // user-defined types (OBJECT, VARRAY, nested table, REF)
        // i.e. types created with CREATE TYPE.
        _user_defined_types: $ => choice(
            // user-defined types are referenced by name;
            // $.referenced_element already covers them,
            // e.g. my_schema.my_object_type
            $.referenced_element
        ),

        // --- Oracle Supplied Types ---
        _oracle_supplied_types: $ => choice(
            $._any_types,
            $._xml_types,
            $._spatial_types,
            $._json_types,
            seq($.kw_sys, UNDERSCORE, $.kw_refcursor),
        ),

        // PL/SQL JSON API object types. The native JSON datatype (21c) is
        // deliberately NOT included: kw_json is a 4-char keyword and in
        // datatype position it split json-prefixed identifiers
        // (json_element_t -> kw_json + ERROR); it stays confined to its
        // keyword-only contexts (IS JSON / FORMAT JSON / json_table).
        _json_types: $ => choice(
            $.kw_json_element_t,
            $.kw_json_object_t,
            $.kw_json_array_t,
            $.kw_json_scalar_t,
            $.kw_json_key_list,
        ),

        _any_types: $ => choice(
            seq($.kw_sys, POINT, $.kw_anydata),
            seq($.kw_sys, POINT, $.kw_anytype),
            seq($.kw_sys, POINT, $.kw_anydataset),
            // any other SYS-owned type, e.g. sys.aq$_jms_text_message
            seq($.kw_sys, POINT, $.identifier)
        ),

        _xml_types: $ => choice(
            $.kw_xmltype,
            $.kw_uritype
        ),

        _spatial_types: $ => choice(
            $.kw_sdo_geometry,
            $.kw_sdo_topo_geometry,
            $.kw_sdo_georaster
        ),

        // --- size/precision helper rules ---
        

        // low precedence for the generic size rule
        // size may be a constant reference: varchar2(cnKeyLength)
        _size: $ => prec(1, seq(BRACKET_LEFT,
            choice($._literal_number, $.referenced_element), BRACKET_RIGHT)),

        // higher precedence for the BYTE/CHAR size rule
        _size_byte_char: $ => prec(2, seq(BRACKET_LEFT,
            choice($._literal_number, $.referenced_element), // varchar2(cnLen)
            optional($.byte_char), BRACKET_RIGHT)),
        _size_precision_scale: $ => seq(BRACKET_LEFT, $._literal_number, optional(seq(COMMA, $._literal_number)), BRACKET_RIGHT),

        _with_local_time_zone: $ => seq(
            $.kw_with,
            optional($.kw_local),
            $.kw_time,
            $.kw_zone
        ),

        byte_char: $ => choice($.kw_byte, $.kw_char),
        outer_join_marker: _ => token('(+)'),

        
        // references the structured datatype rules;
        // used for %TYPE and %ROWTYPE.
        _referenced_datatypes: $ => choice(
            // any built-in or ANSI type
            $._oracle_built_in_datatypes,
            $._ansi_supported_datatypes,
            // any other type, incl. user-defined and Oracle-supplied
            $.referenced_element
        ),

        


        ref_call: $ => seq(
            prec(5, $.referenced_element),
            $.parameter,
            repeat(choice(
                seq(POINT, $.referenced_element, optional($.parameter)),
                $.parameter, // nested collection indexing: tab(i)(j)
            )),
        ),
        parameter_declaration: $ => seq(
            BRACKET_LEFT,
            $.parameter_declaration_element,
            repeat(seq(COMMA, $.parameter_declaration_element)),
            BRACKET_RIGHT,
        ),
        parameter_declaration_element: $ => seq(
            choice($.identifier, $.kw_self), // explicit SELF parameter in members

            choice(
                $._parameter_declaration_element_in,
                $._parameter_declaration_element_in_out_or_out,
            ),
        ),
        _parameter_declaration_element_in: $ => seq(
            optional($.kw_in),
            $.datatype,
            optional($.default_expression),
        ),
        _parameter_declaration_element_in_out_or_out: $ => seq(
            optional($.kw_in),
            $.kw_out,
            optional($.kw_nocopy),
            $.datatype,
        ),
        default_expression: $ => seq(
            choice(
                $.kw_default,
                ASSIGNMENT,
            ),
            $.expression,
        ),
        parameter: $ => seq(
            BRACKET_LEFT,
            // empty list allowed: f() / obj.method()
            optional(seq(
                $.parameter_element,
                repeat(seq(COMMA, $.parameter_element)),
            )),
            BRACKET_RIGHT,
        ),
        parameter_element: $ => seq(
            choice(
                $._parameter_element_positional,
                $._parameter_element_named,
            ),
        ),
        _parameter_element_positional: $ => seq(
            $.parameter_value,
        ),
        _parameter_element_named: $ => seq(
            $.parameter_name,
            ASSOCIATION,
            $.parameter_value,
        ),
        parameter_name: $ => choice(
            $.identifier,
        ),
        parameter_value: $ => choice(
            prec(4, $.referenced_element),
            prec(3, $._literal),
            $.expression,
        ),
        _index: $ => prec(1, seq(
            BRACKET_LEFT,
            $._literal_number,
            BRACKET_RIGHT,
        )),

        _size_precision_scale: $ => seq(
            BRACKET_LEFT,
            $._precision,
            optional(seq(COMMA, $._scale)),
            BRACKET_RIGHT,
        ),
        _precision: $ => seq(
            $._literal_number,
        ),
        _scale: $ => choice(
            $._literal_number,
        ),
        _sign_pos_neg: $ => choice(
            PLUS,
            MINUS,
        ),
        _enable_disable: $ => choice(
            $.kw_enable,
            $.kw_disable,
        ),
        _rename_to: $ => seq(
            $.kw_rename,
            $.kw_to,
            $.identifier,
        ),
        _expression_operator_boolean: $ => choice(
            NOT_EQUAL_1,
            NOT_EQUAL_2,
            NOT_EQUAL_3,
            NOT_EQUAL_4,
            LESS_THEN_EQUAL,
            GREATER_THEN_EQUAL,
            LESS_THEN,
            GREATER_THEN,
            EQUAL,
            // Oracle tolerates whitespace inside two-char operators
            seq('!', EQUAL),
            seq(LESS_THEN, EQUAL),
            seq(GREATER_THEN, EQUAL),
        ),
        _expression_operator_not_boolean: $ => choice(
            CONCAT,
            EXPONENT,
            PLUS,
            MINUS,
            MULTIPLICATION,
            DIVISON,
            // collection set operators: MULTISET UNION [DISTINCT|ALL] ...
            seq($.kw_multiset,
                choice($.kw_union, $.kw_intersect, $.kw_except),
                optional(choice($.kw_distinct, $.kw_all))),
            // expr AT TIME ZONE tz
            seq($.kw_at, $.kw_time, $.kw_zone),
            // arithmetic modulo: x MOD y
            $.kw_mod,
        ),
        placeholder: $ => prec.right(
            seq(
                $.host_variable,
                optional($.indicator_variable),
            ),
        ),
        correlation_variable: $ => prec.right(
            seq(
                COLON,
                choice($.kw_new, $.kw_old),
                optional(seq(UNDERSCORE, $.identifier)),
                optional(seq(POINT, field("field_name", $.identifier)))
            )
        ),
        indicator_variable: $ => seq(
            DOUBLE_POINT,
            $.identifier,
        ),
        host_variable: $ => seq(
            DOUBLE_POINT,
            $.identifier,
        ),
        identifier: $ => prec.right(choice(
            $._unquoted_identifier,
            $._quoted_identifier,
        )),
        // includes Latin-1 Supplement letters: identifiers like descripción.
        // Ranges skip × (U+00D7) and ÷ (U+00F7). Keep in sync with
        // is_word_char in src/scanner.c.
        _unquoted_identifier: _ => /[A-zÀ-ÖØ-öø-ÿ][A-z0-9_$#À-ÖØ-öø-ÿ]*/,
        _quoted_identifier: _ => /"(""|[^"])*"/,

        _identifier_with_underscore: $ => token(
            seq(
                field("first_part", /[a-zA-Z][a-zA-Z0-9_$#]*/),
                UNDERSCORE,
                field("second_part", /[a-zA-Z][a-zA-Z0-9_$#]*/)
            )
        ),
        _referenced_element_list: $ => seq(
            BRACKET_LEFT,
            $.referenced_element_repeat,
            BRACKET_RIGHT,
        ),
        referenced_element_repeat: $ => seq(
            // ref_call: indexed collection targets like INTO vtab(i)
            choice($.referenced_element, $.ref_call),
            repeat(seq(COMMA, choice($.referenced_element, $.ref_call))),
        ),
        _identifier_list: $ => seq(
            BRACKET_LEFT,
            $.identifier_list_repeat,
            BRACKET_RIGHT,
        ),
        insert_column: $ => seq(
            $.identifier,
            optional(seq(POINT, $.identifier)), // alias.column
        ),
        identifier_list_repeat: $ => seq(
            $.identifier,
            repeat(seq(COMMA, $.identifier)),
        ),
        _literal_list: $ => seq(
            BRACKET_LEFT,
            $.literal_list_repeat,
            BRACKET_RIGHT,
        ),
        _literal_list_multi: $ => seq(
            BRACKET_LEFT,
            $.literal_list_repeat_min,
            BRACKET_RIGHT,
        ),
        literal_list_repeat: $ => seq(
            $._literal,
            repeat(
                seq(COMMA, $._literal),
            ),
        ),
        literal_list_repeat_min: $ => seq(
            $._literal,
            repeat1(
                seq(COMMA, $._literal),
            ),
        ),
        _literal: $ => prec(2, choice(
            $._literal_number,
            $.literal_string,
            $._literal_boolean,
        )),
        _literal_boolean: $ => choice(
            $.kw_true,
            $.kw_false,
            $.kw_null,
        ),
        _literal_number: $ => seq(
            optional($._sign_pos_neg),
            choice(
                prec(1, $.float),
                $.number,
            ),
        ),
        literal_string: $ => choice(
            $._single_quote_string,
            $._q_quote_string,
        ),
        // doubled quotes escape: 'it''s', '''' (empty string is just '')
        _single_quote_string: $ => /'([^']|'')*'/,
        // Oracle alternative quoting: q'[...]', q'(...)', q'{...}', q'<...>',
        // q'!...!', q'#...#'
        _q_quote_string: _ => token(
            /[qQ]'(\[[^\]]*\]|\([^)]*\)|\{[^}]*\}|<[^>]*>|![^!]*!|#[^#]*#)'/
        ),
        number: $ => /\d+/,
        float: $ => /\d*[.]\d+/,
        inquiry_directive: _ => token(/\$\$[A-Za-z][A-Za-z0-9_#$]*/),
        conditional_compilation: _ => token(
            /\$[iI][fF][^$]*\$[tT][hH][eE][nN]|\$[eE][lL][sS][iI][fF][^$]*\$[tT][hH][eE][nN]|\$[eE][lL][sS][eE]|\$[eE][nN][dD]/
        ),
        comment_ml: $ => token(
            seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")
        ),
        comment_sl: $ => token(
            seq("--", /.*/)
        ),
        sql_statement_merge: $ => seq(
            $.kw_merge,
            $.kw_into,
            $.referenced_element,
            optional(field("alias", $.identifier)), // merge into t dest
            $.kw_using,
            // USING takes a table name or a parenthesized subquery
            choice(
                seq($.referenced_element,
                    optional(field("alias", $.identifier))),
                seq(BRACKET_LEFT, $._subquery, BRACKET_RIGHT,
                    optional(field("alias", $.identifier))),
            ),
            $.kw_on,
            BRACKET_LEFT,
            $.expression,
            BRACKET_RIGHT,
            repeat1(choice($.merge_update_clause, $.merge_insert_clause)),
            optional($._error_logging_clause),
        ),
        sql_statement_insert: $ => seq(
            $.kw_insert,
            choice(
                $.single_table_insert,
                // $.multi_table_insert,
            ),
        ),
        single_table_insert: $ => seq(
            $.kw_into,
            $._query_table_expression,
            optional($.identifier),
            // column list entries may be alias-qualified: (x.col1, x.col2)
            optional(seq(BRACKET_LEFT, $.insert_column,
                repeat(seq(COMMA, $.insert_column)), BRACKET_RIGHT)),
            choice(
                $._subquery,
                seq($.values_clause, optional($._returning_clause)),
            ),
            optional($._error_logging_clause),
        ),
        sql_statement_update: $ => seq(
            $.kw_update,
            choice(
                $._table_reference,
                seq(BRACKET_LEFT, $._table_reference, BRACKET_RIGHT),
            ),
            optional($.update_set_clause),
            optional($.where_clause),
            optional($._returning_clause),
            optional($._error_logging_clause),
        ),
        update_set_clause: $ => seq(
            $.kw_set,
            $.update_set_clause_elements,
            repeat(seq(COMMA, $.update_set_clause_elements)),
        ),
        update_set_clause_elements: $ => choice(
            $._update_set_clause_value,
            $._update_set_clause_column,
            $._update_set_clause_select,
        ),
        _update_set_clause_column: $ => seq(
            $.referenced_element, // supports alias.column
            EQUAL,
            choice($.expression, $.kw_default),
        ),
        _update_set_clause_select: $ => seq(
            // columns may be alias-qualified: SET (h.a, h.b) = (SELECT ...)
            seq(BRACKET_LEFT,
                $.update_column, repeat(seq(COMMA, $.update_column)),
                BRACKET_RIGHT),
            EQUAL,
            BRACKET_LEFT,
            $.sql_statement_select,
            BRACKET_RIGHT,
        ),
        update_column: $ => seq(
            $.identifier,
            optional(seq(POINT, $.identifier)),
        ),
        _update_set_clause_value: $ => seq(
            $.kw_value,
            BRACKET_LEFT,
            $.identifier,
            BRACKET_RIGHT,
            EQUAL,
            $.expression,
        ),
        sql_statement_delete: $ => seq(
            $.kw_delete,
            optional($.kw_from),
            choice(
                $._table_reference,
                seq(BRACKET_LEFT, $._table_reference, BRACKET_RIGHT),
            ),
            optional($.where_clause),
            optional($._returning_clause),
            optional($._error_logging_clause),
        ),
        sql_statement_select: $ => seq(
            choice(
                // SELECT starting with WITH
                seq(
                    $.with_clause,
                    $._subquery
                ),
                // plain SELECT without WITH
                $._subquery
            ),
            // ORDER BY may follow FOR UPDATE (plain ORDER BY belongs to the
            // subquery itself)
            optional(seq($.for_update_clause, optional($.order_by_clause))),
        ),

        _subquery: $ => seq(
            $._subquery_element,
            // set operators: q UNION [ALL] q | INTERSECT | MINUS ...
            repeat($._subquery_element_union_intersect_minus),
            optional($.order_by_clause),
            optional($.row_limiting_clause),
        ),
        _subquery_element: $ => choice(
            prec(3, seq($._query_block_without_with)),
            seq(BRACKET_LEFT, optional($.with_clause), $._subquery, BRACKET_RIGHT),
        ),
        _query_block: $ => seq(
            optional($.with_clause),
            $.kw_select,
            optional(choice($.kw_distinct, $.kw_unique, $.kw_all)),
            $.select_list,
            optional($._into_and_bulk_clause),
            $.kw_from,
            $.table_list,
            optional($.where_clause),
            optional($.hierachical_query_clause),
            optional($.group_by_clause),
            optional($.having_clause),
        ),
        _query_block_without_with: $ => seq(
            $.kw_select,
            optional(choice($.kw_distinct, $.kw_unique, $.kw_all)),
            $.select_list,
            optional($._into_and_bulk_clause),
            $.kw_from,
            $.table_list,
            optional($.where_clause),
            optional($.hierachical_query_clause),
            optional($.group_by_clause),
            optional($.having_clause),
        ),

        _subquery_for_cte: $ => seq(
            choice(
                prec(3, $._query_block_without_with),
                seq(
                    prec(3, $._query_block_without_with),
                    repeat1($._subquery_element_union_intersect_minus)
                ),
                seq(BRACKET_LEFT, $._subquery_for_cte, BRACKET_RIGHT)
            ),
            optional($.order_by_clause),
            optional($.row_limiting_clause),
        ),
        _into_and_bulk_clause: $ => choice(
            $.into_clause,
            $.bulk_collect_into,
        ),
        bulk_collect_into: $ => seq(
            $.kw_bulk,
            $.kw_collect,
            $.kw_into,
            $.referenced_element_repeat,
            optional(seq($.kw_limit, $.expression)),
        ),
        into_clause: $ => seq(
            $.kw_into,
            $.referenced_element_repeat,
        ),
        select_list: $ => seq(
            $.select_list_element,
            repeat(seq(COMMA, $.select_list_element)),
        ),
        select_list_element: $ => choice(
            $.kw_asterisk,
            // `.*` is one token so `a.*` never competes with dotted chains
            seq($.referenced_element, $.qualified_asterisk),
            seq($.expression, optional($.kw_as), optional($.identifier)),
        ),
        qualified_asterisk: _ => token('.*'),
        where_clause: $ => seq(
            $.kw_where,
            choice(
                $.expression,
                seq($.kw_current, $.kw_of, $.identifier), // WHERE CURRENT OF cursor
            ),
        ),
        group_by_clause: $ => seq(
            $.kw_group,
            $.kw_by,
            $.expression,
            repeat(seq(COMMA, $.expression)),
        ),
        having_clause: $ => seq(
            $.kw_having,
            $.expression,
        ),
        hierachical_query_clause: $ => choice(
            $._hierachical_query_clause_connect_by,
            $._hierachical_query_clause_start_with,
        ),
        _hierachical_query_clause_start_with: $ => seq(
            $.kw_start,
            $.kw_with,
            $.expression,
            $.kw_connect,
            $.kw_by,
            optional($.kw_nocycle),
            $.expression,
        ),
        _hierachical_query_clause_connect_by: $ => seq(
            $.kw_connect,
            $.kw_by,
            optional($.kw_nocycle),
            $.expression,
            optional(seq($.kw_start, $.kw_with, $.expression)),
        ),
        table_list: $ => seq(
            $.table_list_element,
            repeat(seq(COMMA, $.table_list_element)),
        ),
        table_list_element: $ => choice(
            $._table_reference,
            $._inline_analytic_view,
            $.join_clause,
            seq(BRACKET_LEFT, $.join_clause, BRACKET_RIGHT),
        ),
        join_clause: $ => seq(
            // LHS may itself be a parenthesized join:
            // FROM (a JOIN b ON ...) LEFT JOIN c
            choice(
                $._table_reference,
                seq(BRACKET_LEFT, $.join_clause, BRACKET_RIGHT),
            ),
            repeat1(
                choice(
                    $._inner_cross_join_clause,
                    $._outer_join_clause,
                    $._cross_outer_apply_clause,
                ),
            ),
        ),
        _cross_outer_apply_clause: $ => prec(2, seq(
            choice($.kw_cross, $.kw_outer),
            $.kw_apply,
            $.kw_join,
            choice(
                $._table_reference,
                $._table_collection_expression,
            ),
        )),
        _outer_join_clause: $ => seq(
            optional($._query_partiion_clause),
            optional($.kw_natural),
            $.outer_join_type,
            $.kw_join,
            $._table_reference,
            optional($._query_partiion_clause),
            optional($._join_on_using),
        ),
        outer_join_type: $ => seq(
            choice(
                $.kw_full,
                $.kw_left,
                $.kw_right,
            ),
            optional($.kw_outer),
        ),
        _query_partiion_clause: $ => seq(
            $.kw_partition,
            $.kw_by,
            seq($.expression, repeat(seq(COMMA, $.expression))),
        ),
        _table_reference: $ => prec(1, seq(
            choice(
                $._query_table_expression,
                $._container_clause,
                $._shards_clause,
                $._table_collection_expression,
            ),
            // NEW/OUTER/INNER appear as aliases; seq(kw_group, identifier)
            // absorbs aliases like groupFrom (lexed as GROUP + From)
            optional(field("alias", choice($.identifier, $.kw_new,
                                           $.kw_outer, $.kw_inner,
                                           seq($.kw_group, $.identifier)))),
        )),

        
        _table_collection_expression: $ => seq(
            $.kw_table,
            BRACKET_LEFT,
            // TABLE(pkg.fn(a, b)), TABLE(CAST(x AS T)), TABLE(subquery)
            choice($.expression, $._subquery),
            BRACKET_RIGHT,
        ),
        _query_table_expression: $ => choice(
            $._query_table_expression_ref_element,
            $._query_table_expression_lateral,
            $._query_table_expression_inline_view,
            $.xmltable_expression,
            $.json_table_expression,
        ),
        // XMLTABLE('xquery'
        //          [PASSING [BY VALUE] expr [AS alias], ...]
        //          [RETURNING SEQUENCE BY REF]
        //          [COLUMNS name type [BY REF|BY VALUE] [PATH 'str']
        //                   [DEFAULT expr] | name FOR ORDINALITY, ...])
        xmltable_expression: $ => seq(
            $.kw_xmltable,
            BRACKET_LEFT,
            $.expression,
            optional(seq(
                $.kw_passing,
                optional(seq($.kw_by, $.kw_value)),
                $.xml_passing_item,
                repeat(seq(COMMA, $.xml_passing_item)),
            )),
            optional(seq($.kw_returning, $.kw_sequence, $.kw_by, $.kw_ref)),
            optional(seq(
                $.kw_columns,
                $.xmltable_column,
                repeat(seq(COMMA, $.xmltable_column)),
            )),
            BRACKET_RIGHT,
        ),
        xml_passing_item: $ => seq(
            $.expression,
            optional(seq($.kw_as,
                choice($.identifier, seq($.kw_evalname, $.expression)))),
        ),
        xmltable_column: $ => choice(
            seq($.identifier, $.kw_for, $.kw_ordinality),
            seq($.identifier, $.datatype, // incl. XMLTYPE
                optional(seq($.kw_by, choice($.kw_ref, $.kw_value))),
                optional(seq($.kw_path, $.literal_string)),
                optional($.default_expression)),
        ),
        // JSON_TABLE(expr [FORMAT JSON] [, 'path'] [<behavior> ON ERROR]
        //            [COLUMNS (name type [FORMAT JSON [ALLOW|DISALLOW
        //            SCALARS]] [PATH 'str'] [<behavior> ON ERROR|EMPTY], ...)])
        json_table_expression: $ => seq(
            $.kw_json_table,
            BRACKET_LEFT,
            $.expression,
            optional(seq($.kw_format, $.kw_json)),
            optional(seq(COMMA, $.expression)),
            optional($.json_on_error_clause),
            optional(seq(
                $.kw_columns,
                BRACKET_LEFT,
                $.json_table_column,
                repeat(seq(COMMA, $.json_table_column)),
                BRACKET_RIGHT,
            )),
            BRACKET_RIGHT,
        ),
        // ERROR | NULL | DEFAULT <literal>  ON  ERROR | EMPTY
        json_on_error_clause: $ => seq(
            choice($.kw_error, $.kw_null, seq($.kw_default, $._literal)),
            $.kw_on,
            choice($.kw_error, $.kw_empty),
        ),
        json_table_column: $ => choice(
            seq($.identifier, $.kw_for, $.kw_ordinality),
            seq($.identifier, $.datatype,
                optional(seq($.kw_format, $.kw_json,
                    optional(seq(choice($.kw_allow, $.kw_disallow), $.kw_scalars)))),
                optional(seq($.kw_path, $.literal_string)),
                repeat($.json_on_error_clause)),
        ),
        // inline view: FROM (SELECT ...) alias
        _query_table_expression_inline_view: $ => seq(
            BRACKET_LEFT,
            optional($.with_clause), // FROM (WITH x AS (...) SELECT ...)
            $._subquery,
            optional($._subquery_restriction_clause),
            BRACKET_RIGHT,
        ),
        _cross_outer_apply_clause: $ => seq(
            choice($.kw_cross, $.kw_outer),
            $.kw_apply,
            $.kw_join,
            choice(
                $._table_reference,
                $._table_collection_expression,
            ),
        ),
        _query_table_expression_ref_element: $ => seq(
            $.referenced_element,
            optional(
                choice(
                    $._partition_extension_clause,
                    $._modified_external_table,
                    $._hierachies_clause,
                ),
            ),
            optional($._sample_clause)
        ),
        _query_table_expression_lateral: $ => seq(
            $.kw_lateral,
            BRACKET_LEFT,
            $._subquery,
            optional($._subquery_restriction_clause),
            BRACKET_RIGHT,
        ),
        _partition_extension_clause: $ => seq(
            choice($.kw_partition, $.kw_subpartition),
            choice(
                seq(BRACKET_LEFT, $.identifier, BRACKET_RIGHT),
                seq($.kw_for, $._identifier_list),
            ),
        ),
        _modified_external_table: $ => seq(
            $.kw_external,
            $.kw_modify,
            optional($._modified_external_table_properties_default_directory),
            optional($._modified_external_table_properties_location),
            optional($._modified_external_table_properties_access),
            optional($._modified_external_table_properties_reject),
        ),
        _modified_external_table_properties_reject: $ => seq(
            $.kw_reject,
            $.kw_limit,
            choice(
                $.kw_unlimited,
                $._literal_number,
            ),
        ),
        _modified_external_table_properties_default_directory: $ => seq(
            $.kw_default,
            $.kw_directory,
            $.identifier,
        ),
        _modified_external_table_properties_location: $ => seq(
            $.kw_location,
            BRACKET_LEFT,
            $._modified_external_table_properties_location_element,
            repeat(seq(COMMA, $._modified_external_table_properties_location_element)),
            BRACKET_RIGHT,
        ),
        _modified_external_table_properties_access: $ => seq(
            $.kw_access,
            $.kw_parameters,
            repeat1(
                seq(
                    choice(
                        $.kw_badfile,
                        $.kw_logfile,
                        $.kw_discardfile,
                    ),
                    $.literal_string,
                ),
            ),
        ),
        _modified_external_table_properties_location_element: $ => seq(
            optional(seq($.identifier, DOUBLE_POINT)),
            $.literal_string,
        ),
        _sample_clause: $ => seq(
            $.kw_sample,
            optional($.kw_block),
            BRACKET_LEFT,
            $._literal_number,
            BRACKET_RIGHT,
            optional(seq($.kw_seed, BRACKET_LEFT, $._literal_number, BRACKET_RIGHT)),
        ),
        _container_clause: $ => seq(
            $.kw_containers,
            BRACKET_LEFT,
            $.referenced_element,
            BRACKET_RIGHT,
        ),
        _shards_clause: $ => seq(
            $.kw_shards,
            BRACKET_LEFT,
            $.referenced_element,
            BRACKET_RIGHT,
        ),
        _inner_cross_join_clause: $ => choice(
            $._inner_cross_join_clause_cross_natural,
            $._inner_cross_join_clause_inner,
        ),
        _inner_cross_join_clause_inner: $ => seq(
            optional($.kw_inner),
            $.kw_join,
            $._table_reference,
            $._join_on_using,
        ),
        _inner_cross_join_clause_cross_natural: $ => seq(
            choice(
                $.kw_cross,
                seq($.kw_natural, optional($.kw_inner)),
            ),
            $.kw_join,
            $._table_reference,
        ),
        _join_on_using: $ => choice(
            seq($.kw_on, $.expression),
            seq($.kw_using, $._identifier_list),
        ),
        _inline_analytic_view: $ => seq(
            $.kw_analytic,
            $.kw_view,
            $._sub_av_clause,
            optional($.kw_as),
            optional($.identifier),
        ),
        with_clause: $ => seq(
            $.kw_with,
            seq(
                field("query_name", $.identifier),
                optional($._referenced_element_list),
                $.kw_as,
                BRACKET_LEFT,
                $._subquery_for_cte,
                BRACKET_RIGHT,
                // recursive CTE: SEARCH DEPTH FIRST BY ... SET ... / CYCLE ...
                optional($._search_clause),
                optional($._cycle_clause),
            ),
            repeat(
                seq(
                    COMMA,
                    field("query_name", $.identifier),
                    optional($._referenced_element_list),
                    $.kw_as,
                    BRACKET_LEFT,
                    $._subquery_for_cte,
                    BRACKET_RIGHT,
                    optional($._search_clause),
                    optional($._cycle_clause),
                )
            )
        ),
        _subquery_restriction_clause: $ => seq(
            $.kw_with,
            choice(
                seq($.kw_read, $.kw_only),
                seq($.kw_check, $.kw_option),
            ),
            optional(
                seq($.kw_constraint, $.identifier),
            ),
        ),
        _subav_factoring_clause: $ => seq(
            field("subav_name", $.identifier),
            $.kw_analytic,
            $.kw_view,
            $.kw_as,
            BRACKET_LEFT,
            $._sub_av_clause,
            BRACKET_RIGHT,
            optional($._search_clause),
            optional($._cycle_clause),
        ),
        _subav_factoring_clause: $ => seq(
            field("subav_name", $.identifier),
            $.kw_analytic,
            $.kw_view,
            $.kw_as,
            BRACKET_LEFT,
            $._sub_av_clause,
            BRACKET_RIGHT,
            optional($._search_clause),
            optional($._cycle_clause),
        ),
        _sub_av_clause: $ => seq(
            $.kw_using,
            $.referenced_element,
            optional($._hierachies_clause),
            optional($._filter_clauses),
            optional($._add_meas_clause),

        ),
        _hierachies_clause: $ => seq(
            $.kw_hierarchies,
            BRACKET_LEFT,
            optional($.referenced_element_repeat),
            BRACKET_RIGHT,
        ),
        _filter_clauses: $ => seq(
            $.kw_filter,
            $.kw_fact,
            BRACKET_LEFT,
            optional($._filter_clause),
            BRACKET_RIGHT,
        ),
        _filter_clause: $ => seq(
            $._hier_ids,
            $.kw_to,
            $.expression,
        ),
        _hier_ids: $ => seq(
            $._hier_id,
            repeat(
                seq(COMMA, $._hier_id),
            ),
        ),
        _hier_id: $ => choice(
            $.kw_measures,
            $.referenced_element,
        ),
        _add_meas_clause: $ => seq(
            $.kw_add,
            $.kw_measures,
            $._cube_meas_list,
        ),
        _cube_meas_list: $ => seq(
            BRACKET_LEFT,
            $._cube_meas,
            optional(seq(COMMA, $._cube_meas)),
            BRACKET_RIGHT,
        ),
        _cube_meas: $ => seq(
            $.identifier,
            choice(
                $._base_meas_clause,
                $._calc_meas_clause,
            ),
        ),
        _calc_meas_clause: $ => seq(
            $.identifier,
            $.kw_as,
            BRACKET_LEFT,
            $.expression,
            BRACKET_RIGHT,
        ),
        _base_meas_clause: $ => seq(
            $.kw_fact,
            $.kw_for,
            $.kw_measure,
            $.identifier,
            $._meas_aggrecate_clause,
        ),
        _meas_aggrecate_clause: $ => seq(
            $.kw_aggregate,
            $.kw_by,
            $.identifier,
        ),
        aggregate_function_argument: $ => seq(
            BRACKET_LEFT,
            optional(seq(
                optional(choice($.kw_distinct, $.kw_unique, $.kw_all)),
                choice($.expression, $.kw_asterisk),
            )),
            BRACKET_RIGHT,
        ),
        aggregate_function_call: $ => prec.right(1, seq(
            choice(
                $.kw_count,
                $.kw_sum,
                $.kw_avg,
                $.kw_min,
                $.kw_max,
            ),
            $.aggregate_function_argument
        )),

        scalar_subquery: $ => prec.right(1, seq(
            BRACKET_LEFT,
            $._subquery_for_cte,
            BRACKET_RIGHT,
        )),
        _cycle_clause: $ => seq(
            $.kw_cycle,
            $.referenced_element_repeat,
            $.kw_set,
            $.referenced_element,
            $.kw_to,
            $.literal_string,
            $.kw_default,
            $.literal_string,
        ),
        _search_clause: $ => seq(
            $.kw_search,
            choice($.kw_depth, $.kw_breadth),
            $.kw_first,
            $.kw_by,
            repeat1($._search_clause_alias),
            $.kw_set,
            $.identifier,
        ),
        _search_clause_alias: $ => seq(
            $.identifier,
            optional(
                choice($.kw_asc, $.kw_desc),
            ),
            optional(
                seq(
                    $.kw_nulls,
                    choice($.kw_first, $.kw_last),
                ),
            ),
        ),
        _subquery_element_union_intersect_minus: $ => seq(
            choice(
                seq($.kw_union, optional($.kw_all)),
                $.kw_intersect,
                $.kw_minus,
            ),
            $._subquery_element,
        ),
        order_by_clause: $ => seq(
            $.kw_order,
            optional($.kw_siblings),
            $.kw_by,
            $.order_by_clause_element,
            repeat(seq(COMMA, $.order_by_clause_element)),
        ),
        order_by_clause_element: $ => prec(3, seq(
            choice(
                $.expression,
                $.identifier,  // aliases may be used directly
            ),
            optional(
                choice($.kw_asc, $.kw_desc),
            ),
            optional(seq($.kw_nulls, choice($.kw_first, $.kw_last)))),
        ),
        row_limiting_clause: $ => choice(
            seq($.row_limiting_clause_offset, $.row_limiting_clause_fetch),
            seq($.row_limiting_clause_offset),
            seq($.row_limiting_clause_fetch),
        ),
        row_limiting_clause_fetch: $ => seq(
            $.kw_fetch,
            choice($.kw_first, $.kw_next),
            optional(
                seq(
                    $.expression,
                    optional($.kw_percent),
                ),
            ),
            choice($.kw_row, $.kw_rows),
            choice($.kw_only, seq($.kw_with, $.kw_ties)),
        ),
        row_limiting_clause_offset: $ => seq(
            $.kw_offset,
            $.expression,
            choice($.kw_row, $.kw_rows),
        ),
        values_clause: $ => seq(
            $.kw_values,
            choice(
                seq(BRACKET_LEFT,
                    $.expression,
                    repeat(seq(COMMA, $.expression)),
                    BRACKET_RIGHT),
                // record variant: FORALL i ... INSERT INTO t VALUES rec(i)
                $.ref_call,
                $.referenced_element,
            ),
        ),
        merge_update_clause: $ => seq(
            $.kw_when,
            $.kw_matched,
            $.kw_then,
            $.kw_update,
            $.update_set_clause,
            optional($.where_clause),
            optional(seq($.kw_delete, $.where_clause)),
        ),
        merge_insert_clause: $ => seq(
            $.kw_when,
            $.kw_not,
            $.kw_matched,
            $.kw_then,
            $.kw_insert,
            $._identifier_list,
            $.kw_values,
            BRACKET_LEFT,
            $.expression,
            repeat(seq(COMMA, $.expression)),
            BRACKET_RIGHT,
            optional($.where_clause),
        ),
        for_update_clause: $ => seq(
            $.kw_for,
            $.kw_update,
            optional(
                $.for_update_clause_of,
            ),
            optional($.for_update_clause_extension), // NOWAIT | WAIT n | SKIP LOCKED
        ),
        for_update_clause_of: $ => seq(
            $.kw_of,
            $.referenced_element,
            repeat(seq(COMMA, $.referenced_element)),
        ),
        for_update_clause_extension: $ => choice(
            $.kw_nowait,
            seq($.kw_wait, $.number),
            seq($.kw_skip, $.kw_locked),
        ),

        // --- CREATE TABLE rules ---

        create_table: $ => seq(
            $.create_obj,
            $.kw_table,
            optional($._schema),
            field("table_name", $.identifier),
            BRACKET_LEFT,
            seq(
                $.table_element,
                repeat(seq(COMMA, $.table_element))
            ),
            BRACKET_RIGHT,
            optional($.table_properties),
            SEMICOLON,
            optional(DIVISION),
        ),

        table_element: $ => choice(
            $.table_column_definition,
            $.table_constraint,
        ),

        table_column_definition: $ => seq(
            field("column_name", $.identifier),
            // specialized type rule for CREATE TABLE
            $.datatype,
            optional($.column_default),
            optional($.column_constraint),
        ),

        column_default: $ => seq(
            $.kw_default,
            $.expression,
        ),

        column_constraint: $ => choice(
            $.constraint_null,
            $.constraint_not_null,
            $.constraint_unique,
            $.constraint_primary_key,
            $.constraint_check,
            $.constraint_references,
        ),

        constraint_null: $ => seq($.kw_null),
        constraint_not_null: $ => seq($.kw_not, $.kw_null),
        constraint_unique: $ => seq($.kw_unique),
        constraint_primary_key: $ => seq($.kw_primary, $.kw_key),
        constraint_check: $ => seq(
            $.kw_check,
            BRACKET_LEFT,
            $.expression,
            BRACKET_RIGHT,
        ),
        constraint_references: $ => seq(
            $.kw_references,
            $.referenced_element,
            optional(seq(BRACKET_LEFT, $.identifier, BRACKET_RIGHT)),
        ),

        table_constraint: $ => choice(
            $.table_constraint_primary_key,
            $.table_constraint_unique,
            $.table_constraint_foreign_key,
            $.table_constraint_check,
        ),

        table_constraint_primary_key: $ => seq(
            optional(seq($.kw_constraint, field("constraint_name", $.identifier))),
            $.kw_primary,
            $.kw_key,
            BRACKET_LEFT,
            field("column_name", $.identifier),
            repeat(seq(COMMA, field("column_name", $.identifier))),
            BRACKET_RIGHT,
        ),

        table_constraint_unique: $ => seq(
            optional(seq($.kw_constraint, field("constraint_name", $.identifier))),
            $.kw_unique,
            BRACKET_LEFT,
            field("column_name", $.identifier),
            repeat(seq(COMMA, field("column_name", $.identifier))),
            BRACKET_RIGHT,
        ),

        table_constraint_foreign_key: $ => seq(
            optional(seq($.kw_constraint, field("constraint_name", $.identifier))),
            $.kw_foreign,
            $.kw_key,
            BRACKET_LEFT,
            field("column_name", $.identifier),
            repeat(seq(COMMA, field("column_name", $.identifier))),
            BRACKET_RIGHT,
            $.kw_references,
            field("referenced_table", $.referenced_element),
            BRACKET_LEFT,
            field("referenced_column", $.identifier),
            repeat(seq(COMMA, field("referenced_column", $.identifier))),
            BRACKET_RIGHT,
        ),

        table_constraint_check: $ => seq(
            optional(seq($.kw_constraint, field("constraint_name", $.identifier))),
            $.kw_check,
            BRACKET_LEFT,
            $.expression,
            BRACKET_RIGHT,
        ),

        table_properties: $ => seq(
            repeat1(choice(
                $.table_tablespace,
                $.table_logging,
            )),
        ),

        table_tablespace: $ => seq(
            $.kw_tablespace,
            field("tablespace_name", $.identifier),
        ),

        table_logging: $ => choice(
            $.kw_logging,
            $.kw_nologging,
        ),
        with_read_only_clause: $ => seq(
            $.kw_with,
            choice(
                seq($.kw_read, $.kw_only),
                seq($.kw_check, $.kw_option),
            ),
        ),







        // KEYWORDS
        kw_access: _ => kw("access"),
        kw_accessible: _ => kw("accessible"),
        kw_add: _ => kw("add"),
        kw_after: _ => kw("after"),
        kw_agent: _ => kw("agent"),
        kw_aggregate: _ => kw("aggregate"),
        kw_alter: _ => kw("alter"),
        kw_analytic: _ => kw("analytic"),
        kw_analyze: _ => kw("analyze"),
        kw_and: _ => kw("and"),
        kw_any: _ => kw("any"),
        kw_anydata: _ => kw("anydata"),
        kw_anydataset: _ => kw("anydataset"),
        kw_anytype: _ => kw("anytype"),
        kw_apply: _ => kw("apply"),
        kw_array: _ => kw("array"),
        kw_as: _ => kw("as"),
        kw_asc: _ => kw("asc"),
        kw_associate: _ => kw("associate"),
        kw_asterisk: _ => kw("*"),
        kw_attribute: _ => kw("attribute"),
        kw_audit: _ => kw("audit"),
        kw_authid: _ => kw("authid"),
        kw_autonomous_transaction: _ => kw("autonomous_transaction"),
        kw_avg: _ => kw("avg"),
        kw_badfile: _ => kw("badfile"),
        kw_batch: _ => kw("batch"),
        kw_before: _ => kw("before"),
        kw_between: _ => kw("between"),
        kw_bfile: _ => kw("bfile"),
        kw_binary_double: _ => kw("binary_double"),
        kw_binary_float: _ => kw("binary_float"),
        kw_binary_integer: _ => kw("binary_integer"),
        kw_blob: _ => kw("blob"),
        kw_block: _ => kw("block"),
        kw_body: _ => kw("body"),
        kw_boolean: _ => kw("boolean"),
        kw_breadth: _ => kw("breadth"),
        kw_connect_by_root: _ => kw("connect_by_root"),
        kw_bulk_rowcount: _ => kw("bulk_rowcount"),
        kw_bulk: _ => kw("bulk"),
        kw_by: _ => kw("by"),
        kw_byte: _ => kw("byte"),
        kw_c: _ => kw("c"),
        kw_cache: _ => kw("cache"),
        kw_cascade: _ => kw("cascade"),
        kw_char: _ => kw("char"),
        kw_character: _ => kw("character"),
        kw_charsetfrom: _ => kw("charsetfrom"),
        kw_charsetid: _ => kw("charsetid"),
        kw_check: _ => kw("check"),
        kw_clob: _ => kw("clob"),
        kw_clone: _ => kw("clone"),
        kw_close: _ => kw("close"),
        kw_cluster: _ => kw("cluster"),
        kw_collation: _ => kw("collation"),
        kw_comment: _ => kw("comment"),
        kw_commit: _ => kw("commit"),
        kw_commtted: _ => kw("committed"),
        kw_compile: _ => kw("compile"),
        kw_compound: _ => kw("compound"),
        kw_connect: _ => kw("connect"),
        kw_constant: _ => kw("constant"),
        kw_constraint: _ => kw("constraint"),
        kw_constructor: _ => kw("constructor"),
        kw_container: _ => kw("container"),
        kw_containers: _ => kw("containers"),
        kw_context: _ => kw("context"),
        kw_continue: _ => kw("continue"),
        kw_convert: _ => kw("convert"),
        kw_create: _ => kw("create"),
        kw_credential: _ => kw("credential"),
        kw_cross: _ => kw("cross"),
        kw_crossedition: _ => kw("crossedition"),
        kw_current_user: _ => kw("current_user"),
        kw_current: _ => kw("current"),
        kw_cycle: _ => kw("cycle"),
        kw_cycle: _ => kw("cycle"),
        kw_data: _ => kw("data"),
        kw_database: _ => kw("database"),
        kw_datatype_rowtype: _ => kw("%rowtype"),
        kw_datatype_type: _ => kw("%type"),
        kw_date: _ => kw("date"),
        kw_day: _ => kw("day"),
        kw_db_role_change: _ => kw("db_role_change"),
        kw_ddl: _ => kw("ddl"),
        kw_debug: _ => kw("debug"),
        kw_decimal: _ => kw("decimal"),
        kw_default: _ => kw("default"),
        kw_definer: _ => kw("definer"),
        kw_deleting: _ => kw("deleting"),
        kw_dense_rank: _ => kw("dense_rank"),
        kw_depth: _ => kw("depth"),
        kw_desc: _ => kw("desc"),
        kw_deterministic: _ => kw("deterministic"),
        kw_directory: _ => kw("directory"),
        kw_disable: _ => kw("disable"),
        kw_disassociate: _ => kw("disassociate"),
        kw_discardfile: _ => kw("discardfile"),
        kw_distinct: _ => kw("distinct"),
        kw_double: _ => kw("double"),
        kw_drop: _ => kw("drop"),
        kw_dup_val_on_index: _ => kw("dup_val_on_index"),
        kw_duration: _ => kw("duration"),
        kw_each: _ => kw("each"),
        kw_editionable: _ => kw("editionable"),
        kw_element: _ => kw("element"),
        kw_enable: _ => kw("enable"),
        kw_errors: _ => kw("errors"),
        kw_exception_init: _ => kw("exception_init"),
        kw_exception: _ => kw("exception"),
        kw_exceptions: _ => kw("exceptions"),
        kw_exit: _ => kw("exit"),
        kw_external: _ => kw("external"),
        kw_fact: _ => kw("fact"),
        kw_filter: _ => kw("filter"),
        kw_final: _ => kw("final"),
        kw_float: _ => kw("float"),
        kw_following: _ => kw("following"),
        kw_follows: _ => kw("follows"),
        kw_force: _ => kw("force"),
        kw_foreign: _ => kw("foreign"),
        kw_forward: _ => kw("forward"),
        kw_found: _ => kw("found"),
        kw_from: _ => kw("from"),
        kw_full: _ => kw("full"),
        kw_get: _ => kw("get"),
        kw_goto: _ => kw("goto"),
        kw_grant: _ => kw("grant"),
        kw_group: _ => kw("group"),
        kw_hash: _ => kw("hash"),
        kw_having: _ => kw("having"),
        kw_hierarchies: _ => kw("hierarchies"),
        kw_immediate: _ => kw("immediate"),
        kw_immutable: _ => kw("immutable"),
        kw_including: _ => kw("including"),
        kw_increment: _ => kw("increment"),
        kw_index: _ => kw("index"),
        kw_indicator: _ => kw("indicator"),
        kw_indices: _ => kw("indices"),
        kw_inline: _ => kw("inline"),
        kw_inserting: _ => kw("inserting"),
        kw_instantiable: _ => kw("instantiable"),
        kw_instead: _ => kw("instead"),
        kw_int: _ => kw("int"),
        kw_integer: _ => kw("integer"),
        kw_intersect: _ => kw("intersect"),
        kw_interval: _ => kw("interval"),
        kw_into: _ => kw("into"),
        kw_invalidate: _ => kw("invalidate"),
        kw_isolation: _ => kw("isolation"),
        kw_isopen: _ => kw("isopen"),
        kw_java: _ => kw("java"),
        kw_join: _ => kw("join"),
        kw_json_array_t: _ => kw("json_array_t"),
        kw_json_element_t: _ => kw("json_element_t"),
        kw_json_key_list: _ => kw("json_key_list"),
        kw_json_object_t: _ => kw("json_object_t"),
        kw_json_scalar_t: _ => kw("json_scalar_t"),
        kw_key: _ => kw("key"),
        kw_language: _ => kw("language"),
        kw_lateral: _ => kw("lateral"),
        kw_left: _ => kw("left"),
        kw_length: _ => kw("length"),
        kw_level: _ => kw("level"),
        kw_library: _ => kw("library"),
        kw_like: _ => kw("like"),
        kw_local: _ => kw("local"),
        kw_location: _ => kw("location"),
        kw_lock: _ => kw("lock"),
        kw_locked: _ => kw("locked"),
        kw_logfile: _ => kw("logfile"),
        kw_logging: _ => kw("logging"),
        kw_logoff: _ => kw("logoff"),
        kw_logon: _ => kw("logon"),
        kw_long: _ => kw("long"),
        kw_matched: _ => kw("matched"),
        kw_max: _ => kw("max"),
        kw_maxlen: _ => kw("maxlen"),
        kw_maxvalue: _ => kw("maxvalue"),
        kw_measure: _ => kw("measure"),
        kw_measures: _ => kw("measures"),
        kw_member: _ => kw("member"),
        kw_metadata: _ => kw("metadata"),
        kw_min: _ => kw("min"),
        kw_minus: _ => kw("minus"),
        kw_minute: _ => kw("minute"),
        kw_empty: _ => kw("empty"),
        kw_extract: _ => kw("extract"),
        kw_hour: _ => kw("hour"),
        kw_escape: _ => kw("escape"),
        kw_both: _ => kw("both"),
        kw_leading: _ => kw("leading"),
        kw_trailing: _ => kw("trailing"),
        kw_cast: _ => kw("cast"),
        kw_multiset: _ => kw("multiset"),
        kw_except: _ => kw("except"),
        kw_xmltable: _ => kw("xmltable"),
        kw_json_table: _ => kw("json_table"),
        kw_passing: _ => kw("passing"),
        kw_columns: _ => kw("columns"),
        kw_path: _ => kw("path"),
        kw_ordinality: _ => kw("ordinality"),
        kw_xmlelement: _ => kw("xmlelement"),
        kw_xmlattributes: _ => kw("xmlattributes"),
        kw_xmlforest: _ => kw("xmlforest"),
        kw_evalname: _ => kw("evalname"),
        kw_keep: _ => kw("keep"),
        kw_xmlagg: _ => kw("xmlagg"),
        kw_mod: _ => kw("mod"),
        kw_bulk_exceptions: _ => kw("bulk_exceptions"),
        kw_treat: _ => kw("treat"),
        kw_listagg: _ => kw("listagg"),
        kw_overflow: _ => kw("overflow"),
        kw_without: _ => kw("without"),
        kw_within: _ => kw("within"),
        kw_format: _ => kw("format"),
        kw_json: _ => kw("json"),
        kw_strict: _ => kw("strict"),
        kw_lax: _ => kw("lax"),
        kw_scalars: _ => kw("scalars"),
        kw_allow: _ => kw("allow"),
        kw_disallow: _ => kw("disallow"),
        kw_error: _ => kw("error"),
        kw_minvalue: _ => kw("minvalue"),
        kw_mode: _ => kw("mode"),
        kw_modify: _ => kw("modify"),
        kw_month: _ => kw("month"),
        kw_mutable: _ => kw("mutable"),
        kw_name: _ => kw("name"),
        kw_national: _ => kw("national"),
        kw_natural: _ => kw("natural"),
        kw_naturaln: _ => kw("naturaln"),
        kw_nchar: _ => kw("nchar"),
        kw_nclob: _ => kw("nclob"),
        kw_nested: _ => kw("nested"),
        kw_noaudit: _ => kw("noaudit"),
        kw_nocache: _ => kw("nocache"),
        kw_nocopy: _ => kw("nocopy"),
        kw_nocycle: _ => kw("nocycle"),
        kw_nocycle: _ => kw("nocycle"),
        kw_nologging: _ => kw("nologging"),
        kw_none: _ => kw("none"),
        kw_noneditionable: _ => kw("noneditionable"),
        kw_noorder: _ => kw("noorder"),
        kw_notfound: _ => kw("notfound"),
        kw_nowait: _ => kw("nowait"),
        kw_nulls: _ => kw("nulls"),
        kw_number: _ => kw("number"),
        kw_numeric: _ => kw("numeric"),
        kw_nvarchar2: _ => kw("nvarchar2"),
        kw_object: _ => kw("object"),
        kw_of: _ => kw("of"),
        kw_offset: _ => kw("offset"),
        kw_oid: _ => kw("oid"),
        kw_old: _ => kw("old"),
        kw_on: _ => kw("on"),
        kw_only: _ => kw("only"),
        kw_open: _ => kw("open"),
        kw_option: _ => kw("option"),
        kw_or: _ => kw("or"),
        kw_others: _ => kw("others"),
        kw_out: _ => kw("out"),
        kw_overriding: _ => kw("overriding"),
        kw_package: _ => kw("package"),
        kw_pairs: _ => kw("pairs"),
        kw_parallel_enable: _ => kw("parallel_enable"),
        kw_parameters: _ => kw("parameters"),
        kw_parent: _ => kw("parent"),
        kw_partition: _ => kw("partition"),
        kw_percent: _ => kw("percent"),
        kw_persistable: _ => kw("persistable"),
        kw_pipe: _ => kw("pipe"),
        kw_pipelined: _ => kw("pipelined"),
        kw_pivot: _ => kw("pivot"),
        kw_pls_integer: _ => kw("pls_integer"),
        kw_pluggable: _ => kw("pluggable"),
        kw_positive: _ => kw("positive"),
        kw_positiven: _ => kw("positiven"),
        kw_pragma: _ => kw("pragma"),
        kw_pragma: _ => kw("pragma"),
        kw_precedes: _ => kw("precedes"),
        kw_preceding: _ => kw("preceding"),
        kw_precision: _ => kw("precision"),
        kw_primary: _ => kw("primary"),
        kw_raise_application_error: _ => kw("raise_application_error"),
        kw_raise: _ => kw("raise"),
        kw_range: _ => kw("range"),
        kw_rank: _ => kw("rank"),
        kw_raw: _ => kw("raw"),
        kw_read: _ => kw("read"),
        kw_real: _ => kw("real"),
        kw_ref: _ => kw("ref"),
        kw_refcursor: _ => kw("refcursor"),
        kw_reference: _ => kw("reference"),
        kw_references: _ => kw("references"),
        kw_referencing: _ => kw("referencing"),
        kw_reject: _ => kw("reject"),
        kw_relies_on: _ => kw("relies_on"),
        kw_rename: _ => kw("rename"),
        kw_repeat: _ => kw("repeat"),
        kw_reset: _ => kw("reset"),
        kw_result_cache: _ => kw("result_cache"),
        kw_result: _ => kw("result"),
        kw_returning: _ => kw("returning"),
        kw_reuse: _ => kw("reuse"),
        kw_reverse: _ => kw("reverse"),
        kw_revoke: _ => kw("revoke"),
        kw_right: _ => kw("right"),
        kw_row_number: _ => kw("row_number"),
        kw_rowcount: _ => kw("rowcount"),
        kw_rowid: _ => kw("rowid"),
        kw_rows: _ => kw("rows"),
        kw_sample: _ => kw("sample"),
        kw_savepoint: _ => kw("savepoint"),
        kw_schema: _ => kw("schema"),
        kw_sdo_geometry: _ => kw("sdo_geometry"),
        kw_sdo_georaster: _ => kw("sdo_georaster"),
        kw_sdo_topo_geometry: _ => kw("sdo_topo_geometry"),
        kw_search: _ => kw("search"),
        kw_second: _ => kw("second"),
        kw_seed: _ => kw("seed"),
        kw_segment: _ => kw("segment"),
        kw_self: _ => kw("self"),
        kw_sequence: _ => kw("sequence"),
        kw_serializable: _ => kw("serializable"),
        kw_servererror: _ => kw("servererror"),
        kw_settings: _ => kw("settings"),
        kw_shard: _ => kw("shard"),
        kw_shards: _ => kw("shards"),
        kw_shutdown: _ => kw("shutdown"),
        kw_siblings: _ => kw("siblings"),
        kw_signtype: _ => kw("signtype"),
        kw_simple_double: _ => kw("simple_double"),
        kw_simple_float: _ => kw("simple_float"),
        kw_simple_integer: _ => kw("simple_integer"),
        kw_skip: _ => kw("skip"),
        kw_smallint: _ => kw("smallint"),
        kw_specification: _ => kw("specification"),
        kw_sql: _ => kw("sql"),
        kw_start: _ => kw("start"),
        kw_start: _ => kw("start"),
        kw_startup: _ => kw("startup"),
        kw_statement: _ => kw("statement"),
        kw_static: _ => kw("static"),
        kw_statistics: _ => kw("statistics"),
        kw_string: _ => kw("string"),
        kw_struct: _ => kw("struct"),
        kw_subpartition: _ => kw("subpartition"),
        kw_substitutable: _ => kw("substitutable"),
        kw_subtype: _ => kw("subtype"),
        kw_sum: _ => kw("sum"),
        kw_suspend: _ => kw("suspend"),
        kw_sys: _ => kw("sys"),
        kw_table: _ => kw("table"),
        kw_tablespace: _ => kw("tablespace"),
        kw_tdo: _ => kw("tdo"),
        kw_ties: _ => kw("ties"),
        kw_time: _ => kw("time"),
        kw_timestamp: _ => kw("timestamp"),
        kw_timing: _ => kw("timing"),
        kw_transaction: _ => kw("transaction"),
        kw_trigger: _ => kw("trigger"),
        kw_truncate: _ => kw("truncate"),
        kw_unbounded: _ => kw("unbounded"),
        kw_under: _ => kw("under"),
        kw_union: _ => kw("union"),
        kw_unique: _ => kw("unique"),
        kw_unlimited: _ => kw("unlimited"),
        kw_unplug: _ => kw("unplug"),
        kw_updating: _ => kw("updating"),
        kw_uritype: _ => kw("uritype"),
        kw_urowid: _ => kw("urowid"),
        kw_use: _ => kw("use"),
        kw_using_nls_comp: _ => kw("using_nls_comp"),
        kw_using: _ => kw("using"),
        kw_validate: _ => kw("validate"),
        kw_value: _ => kw("value"),
        kw_values: _ => kw("values"),
        kw_varchar: _ => kw("varchar"),
        kw_varchar2: _ => kw("varchar2"),
        kw_varray: _ => kw("varray"),
        kw_varying: _ => kw("varying"),
        kw_view: _ => kw("view"),
        kw_wait: _ => kw("wait"),
        kw_where: _ => kw("where"),
        kw_with: _ => kw("with"),
        kw_work: _ => kw("work"),
        kw_write: _ => kw("write"),
        kw_xml: _ => kw("xml"),
        kw_xmltype: _ => kw("xmltype"),
        kw_year: _ => kw("year"),
        kw_zone: _ => kw("zone"),
    },
});

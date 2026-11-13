package com.kfc.pos.http;

import java.math.BigDecimal;
import java.time.temporal.TemporalAccessor;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class Json {
    private Json() { }

    public static String stringify(Object value) {
        StringBuilder sb = new StringBuilder();
        write(sb, value);
        return sb.toString();
    }

    private static void write(StringBuilder sb, Object value) {
        if (value == null) {
            sb.append("null");
        } else if (value instanceof String s) {
            writeString(sb, s);
        } else if (value instanceof BigDecimal d) {
            sb.append(d.toPlainString());
        } else if (value instanceof Number || value instanceof Boolean) {
            sb.append(value);
        } else if (value instanceof Map<?, ?> map) {
            sb.append('{');
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!first) {
                    sb.append(',');
                }
                writeString(sb, String.valueOf(entry.getKey()));
                sb.append(':');
                write(sb, entry.getValue());
                first = false;
            }
            sb.append('}');
        } else if (value instanceof Collection<?> list) {
            sb.append('[');
            boolean first = true;
            for (Object item : list) {
                if (!first) {
                    sb.append(',');
                }
                write(sb, item);
                first = false;
            }
            sb.append(']');
        } else if (value instanceof java.sql.Timestamp ts) {
            writeString(sb, ts.toInstant().toString());
        } else if (value instanceof TemporalAccessor) {
            writeString(sb, value.toString());
        } else {
            writeString(sb, value.toString());
        }
    }

    private static void writeString(StringBuilder sb, String s) {
        sb.append('"');
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        sb.append('"');
    }

    public static Object parse(String text) {
        Parser parser = new Parser(text);
        Object value = parser.readValue();
        parser.skipSpaces();
        if (!parser.atEnd()) {
            throw new IllegalArgumentException("Invalid JSON: extra text at position " + parser.pos);
        }
        return value;
    }

    private static final class Parser {
        private final String text;
        private int pos;

        Parser(String text) {
            this.text = text == null ? "" : text;
        }

        boolean atEnd() {
            return pos >= text.length();
        }

        void skipSpaces() {
            while (!atEnd() && Character.isWhitespace(text.charAt(pos))) {
                pos++;
            }
        }

        char peek() {
            if (atEnd()) {
                throw new IllegalArgumentException("Invalid JSON: unexpected end");
            }
            return text.charAt(pos);
        }

        void expect(char c) {
            skipSpaces();
            if (peek() != c) {
                throw new IllegalArgumentException("Invalid JSON: expected '" + c + "' at position " + pos);
            }
            pos++;
        }

        Object readValue() {
            skipSpaces();
            char c = peek();
            if (c == '{') {
                return readObject();
            }
            if (c == '[') {
                return readArray();
            }
            if (c == '"') {
                return readString();
            }
            if (text.startsWith("true", pos)) {
                pos += 4;
                return Boolean.TRUE;
            }
            if (text.startsWith("false", pos)) {
                pos += 5;
                return Boolean.FALSE;
            }
            if (text.startsWith("null", pos)) {
                pos += 4;
                return null;
            }
            return readNumber();
        }

        Map<String, Object> readObject() {
            Map<String, Object> map = new LinkedHashMap<>();
            expect('{');
            skipSpaces();
            if (peek() == '}') {
                pos++;
                return map;
            }
            while (true) {
                skipSpaces();
                String key = readString();
                expect(':');
                map.put(key, readValue());
                skipSpaces();
                if (peek() == ',') {
                    pos++;
                } else {
                    expect('}');
                    return map;
                }
            }
        }

        List<Object> readArray() {
            List<Object> list = new ArrayList<>();
            expect('[');
            skipSpaces();
            if (peek() == ']') {
                pos++;
                return list;
            }
            while (true) {
                list.add(readValue());
                skipSpaces();
                if (peek() == ',') {
                    pos++;
                } else {
                    expect(']');
                    return list;
                }
            }
        }

        String readString() {
            expect('"');
            StringBuilder sb = new StringBuilder();
            while (true) {
                char c = peek();
                pos++;
                if (c == '"') {
                    return sb.toString();
                }
                if (c == '\\') {
                    char e = peek();
                    pos++;
                    switch (e) {
                        case 'n' -> sb.append('\n');
                        case 't' -> sb.append('\t');
                        case 'r' -> sb.append('\r');
                        case 'b' -> sb.append('\b');
                        case 'f' -> sb.append('\f');
                        case 'u' -> {
                            sb.append((char) Integer.parseInt(text.substring(pos, pos + 4), 16));
                            pos += 4;
                        }
                        default -> sb.append(e);
                    }
                } else {
                    sb.append(c);
                }
            }
        }

        BigDecimal readNumber() {
            int start = pos;
            while (!atEnd() && "+-0123456789.eE".indexOf(text.charAt(pos)) >= 0) {
                pos++;
            }
            if (start == pos) {
                throw new IllegalArgumentException("Invalid JSON at position " + pos);
            }
            return new BigDecimal(text.substring(start, pos));
        }
    }
}

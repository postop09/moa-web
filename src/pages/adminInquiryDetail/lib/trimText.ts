// DB 와 같은 기준(space, tab, CR, LF)으로만 앞뒤 공백을 자른다.
const EDGE_WHITESPACE = /^[ \t\r\n]+|[ \t\r\n]+$/g;

export const trimText = (value: string) => value.replace(EDGE_WHITESPACE, '');

import { asType } from "./util";

export const register = asType("REGISTER");
export const hexImmediate = asType("HEX_IMM");
export const address = asType("ADDRESS");
export const variable = asType("VARIABLE");

export const opPlus = asType("OP_PLUS");
export const opMinus = asType("OP_MINUS");
export const opMultiply = asType("OP_MULTIPLY");

export const binaryOperation = asType("BINARY_OPERATION");
export const bracketedExpression = asType("BRACKETED_EXPRESSION");
export const squareBracketExpression = asType("SQUARE_BRACKET_EXPRESSION");

export const instruction = asType("INSTRUCTION");
export const label = asType("LABEL");

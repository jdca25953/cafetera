package com.cafetera.exception;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String what) { super(what + " no encontrado"); }
}

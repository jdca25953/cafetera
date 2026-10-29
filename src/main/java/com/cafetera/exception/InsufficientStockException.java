package com.cafetera.exception;

import lombok.Getter;

import java.util.List;

@Getter
public class InsufficientStockException extends RuntimeException {
    private final List<String> ingredients;

    public InsufficientStockException(List<String> ingredients) {
        super("Stock insuficiente");
        this.ingredients = ingredients;
    }
}

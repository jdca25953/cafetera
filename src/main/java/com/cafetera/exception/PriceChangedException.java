package com.cafetera.exception;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class PriceChangedException extends RuntimeException {
    private final BigDecimal currentPrice;

    public PriceChangedException(BigDecimal currentPrice) {
        super("Precio modificado");
        this.currentPrice = currentPrice;
    }
}

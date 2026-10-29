package com.cafetera.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

public enum CupSize {
    SMALL(150),
    MEDIUM(250),   // tamaño de referencia: las recetas se definen para 250 ml
    LARGE(350);

    private static final BigDecimal REFERENCE_ML = BigDecimal.valueOf(250);

    private final int volumeMl;

    CupSize(int volumeMl) { this.volumeMl = volumeMl; }

    public int getVolumeMl() { return volumeMl; }

    public BigDecimal getFactor() {
        return BigDecimal.valueOf(volumeMl).divide(REFERENCE_ML, 2, RoundingMode.HALF_UP);
    }

    /** Escala una cantidad de la receta de referencia a este tamaño. */
    public BigDecimal scale(BigDecimal quantity) {
        BigDecimal r = quantity.multiply(BigDecimal.valueOf(volumeMl))
                .divide(REFERENCE_ML, 2, RoundingMode.HALF_UP);
        return r.signum() == 0 ? new BigDecimal("0.01") : r;   // nunca 0 (la cantidad debe ser positiva)
    }
}
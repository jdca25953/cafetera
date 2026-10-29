package com.cafetera.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "machine_stock")
@Getter
@Setter
@NoArgsConstructor
public class MachineStock {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "machine_id", nullable = false)
    private Long machineId;

    @Column(name = "ingredient_id", nullable = false)
    private Long ingredientId;

    // Solo lectura: la columna ya se escribe con ingredientId
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", insertable = false, updatable = false)
    private Ingredient ingredient;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal stock = BigDecimal.ZERO;

    @Column(name = "min_stock", nullable = false, precision = 10, scale = 2)
    private BigDecimal minStock = BigDecimal.ZERO;

    public boolean isLow()   { return stock.compareTo(minStock) <= 0; }
    public boolean isEmpty() { return stock.signum() == 0; }
}

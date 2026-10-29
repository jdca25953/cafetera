package com.cafetera.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "serving_item")
@Getter
@Setter
@NoArgsConstructor
public class ServingItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "serving_id")
    private Serving serving;

    @Column(name = "ingredient_id")
    private Long ingredientId;

    @Column(name = "ingredient_name", nullable = false)
    private String ingredientName;

    @Column(nullable = false)
    private String unit;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 4)
    private BigDecimal unitPrice;
}

package com.cafetera.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "recipe_item")
@Getter
@Setter
@NoArgsConstructor
public class RecipeItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "coffee_id")
    private Coffee coffee;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ingredient_id")
    private Ingredient ingredient;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;
}

package com.cafetera.model;

import com.cafetera.model.CupSize;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Serving {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id")
    private Machine machine;

    @Column(name = "coffee_id")
    private Long coffeeId;

    @Column(name = "coffee_name", nullable = false)
    private String coffeeName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "cup_size", nullable = false)
    private CupSize size = CupSize.MEDIUM;

    private boolean customized;

    @Column(name = "served_at", nullable = false)
    private Instant servedAt = Instant.now();

    @OneToMany(mappedBy = "serving", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServingItem> items = new ArrayList<>();
}

package com.cafetera.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Coffee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private boolean predefined;

    @OneToMany(mappedBy = "coffee", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecipeItem> recipe = new ArrayList<>();
}

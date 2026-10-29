package com.cafetera.repository;

import com.cafetera.model.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    boolean existsByName(String name);

    Optional<Ingredient> findByName(String name);

    List<Ingredient> findAllByOrderByNameAsc();

    @Query("select count(r) > 0 from RecipeItem r where r.ingredient.id = :id")
    boolean isUsedInRecipe(@Param("id") Long id);
}

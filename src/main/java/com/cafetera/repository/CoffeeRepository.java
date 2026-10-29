package com.cafetera.repository;

import com.cafetera.model.Coffee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CoffeeRepository extends JpaRepository<Coffee, Long> {

    boolean existsByName(String name);

    Optional<Coffee> findByName(String name);

    // join fetch evita el problema N+1 (una consulta por receta e ingrediente)
    @Query("select distinct c from Coffee c left join fetch c.recipe r left join fetch r.ingredient order by c.name")
    List<Coffee> findAllWithRecipe();
}

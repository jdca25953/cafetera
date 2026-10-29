package com.cafetera.service;

import com.cafetera.dto.DTOs.*;
import com.cafetera.exception.BusinessException;
import com.cafetera.exception.NotFoundException;
import com.cafetera.model.Coffee;
import com.cafetera.model.Ingredient;
import com.cafetera.model.RecipeItem;
import com.cafetera.repository.CoffeeRepository;
import com.cafetera.repository.IngredientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoffeeService {

    private final CoffeeRepository coffeeRepo;
    private final IngredientRepository ingredientRepo;

    @Transactional(readOnly = true)
    public List<CoffeeView> findAll() {
        return coffeeRepo.findAllWithRecipe().stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public CoffeeView findById(Long id) {
        return toView(getOrThrow(id));
    }

    @Transactional
    public CoffeeView create(CoffeeRequest req) {
        String name = req.name().trim();
        if (coffeeRepo.existsByName(name))
            throw new BusinessException("Ya existe un café llamado " + name);

        Coffee coffee = new Coffee();
        coffee.setName(name);
        coffee.setPredefined(false);              // los creados por usuarios nunca son predefinidos
        fillRecipe(coffee, req.recipe());
        return toView(coffeeRepo.save(coffee));
    }

    @Transactional
    public CoffeeView update(Long id, CoffeeRequest req) {
        Coffee coffee = getOrThrow(id);
        String name = req.name().trim();
        coffeeRepo.findByName(name)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(o -> { throw new BusinessException("Ya existe un café llamado " + name); });

        coffee.setName(name);
        coffee.getRecipe().clear();
        coffeeRepo.flush();   // ejecuta los DELETE antes de los INSERT (si no, choca la UNIQUE coffee_id+ingredient_id)
        fillRecipe(coffee, req.recipe());
        return toView(coffee);
    }

    @Transactional
    public void delete(Long id) {
        Coffee coffee = getOrThrow(id);
        if (coffee.isPredefined())
            throw new BusinessException("Los cafés predeterminados no se pueden borrar");
        coffeeRepo.delete(coffee);
    }

    // ---------- privados ----------

    private Coffee getOrThrow(Long id) {
        return coffeeRepo.findById(id).orElseThrow(() -> new NotFoundException("Café " + id));
    }

    private void fillRecipe(Coffee coffee, List<RecipeLineDto> lines) {
        Set<Long> ids = lines.stream().map(RecipeLineDto::ingredientId).collect(Collectors.toSet());
        if (ids.size() != lines.size())
            throw new BusinessException("Ingrediente repetido en la receta");

        Map<Long, Ingredient> catalog = ingredientRepo.findAllById(ids).stream()
                .collect(Collectors.toMap(Ingredient::getId, i -> i));
        if (catalog.size() != ids.size())
            throw new NotFoundException("Algún ingrediente");

        for (RecipeLineDto l : lines) {
            RecipeItem item = new RecipeItem();
            item.setCoffee(coffee);
            item.setIngredient(catalog.get(l.ingredientId()));
            item.setQuantity(l.quantity());
            coffee.getRecipe().add(item);
        }
    }

    private CoffeeView toView(Coffee c) {
        List<RecipeLineView> lines = c.getRecipe().stream()
                .map(r -> new RecipeLineView(r.getIngredient().getId(), r.getIngredient().getName(),
                        r.getIngredient().getUnit(), r.getQuantity()))
                .toList();
        BigDecimal price = c.getRecipe().stream()
                .map(r -> r.getIngredient().getPrice().multiply(r.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        return new CoffeeView(c.getId(), c.getName(), price, c.isPredefined(), lines);
    }
}

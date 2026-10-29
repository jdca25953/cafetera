package com.cafetera.service;

import com.cafetera.dto.DTOs.*;
import com.cafetera.exception.BusinessException;
import com.cafetera.exception.NotFoundException;
import com.cafetera.model.Ingredient;
import com.cafetera.repository.IngredientRepository;
import com.cafetera.repository.MachineStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepo;
    private final MachineStockRepository stockRepo;

    @Transactional(readOnly = true)
    public List<IngredientView> findAll() {
        return ingredientRepo.findAllByOrderByNameAsc().stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public IngredientView findById(Long id) {
        return toView(getOrThrow(id));
    }

    @Transactional
    public IngredientView create(IngredientRequest req) {
        String name = req.name().trim();
        if (ingredientRepo.existsByName(name))
            throw new BusinessException("Ya existe un ingrediente llamado " + name);
        Ingredient ing = new Ingredient();
        apply(ing, req);
        return toView(ingredientRepo.save(ing));
    }

    @Transactional
    public IngredientView update(Long id, IngredientRequest req) {
        Ingredient ing = getOrThrow(id);
        String name = req.name().trim();
        ingredientRepo.findByName(name)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(o -> { throw new BusinessException("Ya existe un ingrediente llamado " + name); });
        apply(ing, req);
        return toView(ing);
    }

    @Transactional
    public void delete(Long id) {
        Ingredient ing = getOrThrow(id);
        if (ingredientRepo.isUsedInRecipe(id))
            throw new BusinessException("No se puede borrar: el ingrediente se usa en alguna receta");
        stockRepo.removeAllForIngredient(id);   // quita su stock en todas las cafeteras
        ingredientRepo.delete(ing);
    }

    private Ingredient getOrThrow(Long id) {
        return ingredientRepo.findById(id).orElseThrow(() -> new NotFoundException("Ingrediente " + id));
    }

    private void apply(Ingredient ing, IngredientRequest req) {
        ing.setName(req.name().trim());
        ing.setUnit(req.unit().trim());
        ing.setPrice(req.price());
    }

    private IngredientView toView(Ingredient i) {
        return new IngredientView(i.getId(), i.getName(), i.getUnit(), i.getPrice());
    }
}

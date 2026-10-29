package com.cafetera.service;

import com.cafetera.dto.DTOs.*;
import com.cafetera.exception.NotFoundException;
import com.cafetera.model.*;
import com.cafetera.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockService {

    private final MachineService machineService;
    private final IngredientRepository ingredientRepo;
    private final MachineStockRepository stockRepo;
    private final CoffeeRepository coffeeRepo;
    private final RestockLogRepository restockLogRepo;
    private final AppUserRepository userRepo;

    /** Stock de TODOS los ingredientes del catálogo en esa cafetera (sin fila = 0). */
    @Transactional(readOnly = true)
    public List<StockView> list(String code) {
        Machine m = machineService.getByCode(code);
        Map<Long, MachineStock> rows = stockRepo.findByMachineId(m.getId()).stream()
                .collect(Collectors.toMap(MachineStock::getIngredientId, Function.identity()));
        return ingredientRepo.findAllByOrderByNameAsc().stream()
                .map(i -> toView(i, rows.get(i.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StockView> low(String code) {
        return list(code).stream().filter(StockView::low).toList();
    }

    /** Cafés con precio y disponibilidad según el stock de esa cafetera. */
    @Transactional(readOnly = true)
    public List<MachineCoffeeView> coffees(String code) {
        Machine m = machineService.getByCode(code);
        Map<Long, BigDecimal> stock = stockRepo.findByMachineId(m.getId()).stream()
                .collect(Collectors.toMap(MachineStock::getIngredientId, MachineStock::getStock));

        return coffeeRepo.findAllWithRecipe().stream().map(c -> {
            List<RecipeLineView> lines = c.getRecipe().stream()
                    .map(r -> new RecipeLineView(r.getIngredient().getId(), r.getIngredient().getName(),
                            r.getIngredient().getUnit(), r.getQuantity()))
                    .toList();
            BigDecimal price = c.getRecipe().stream()
                    .map(r -> r.getIngredient().getPrice().multiply(r.getQuantity()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            boolean available = c.getRecipe().stream()
                    .allMatch(r -> stock.getOrDefault(r.getIngredient().getId(), BigDecimal.ZERO)
                            .compareTo(r.getQuantity()) >= 0);
            return new MachineCoffeeView(c.getId(), c.getName(), price, c.isPredefined(), available, lines);
        }).toList();
    }

    @Transactional
    public StockView restock(String code, Long ingredientId, BigDecimal quantity, Long userId) {
        Machine m = machineService.getByCode(code);
        Ingredient ing = getIngredient(ingredientId);
        MachineStock s = lockedOrCreate(m, ing);
        s.setStock(s.getStock().add(quantity));

        RestockLog log = new RestockLog();
        log.setMachineId(m.getId());
        log.setIngredient(ing);
        log.setUser(userId == null ? null : userRepo.findById(userId).orElse(null));
        log.setQuantity(quantity);
        restockLogRepo.save(log);

        return toView(ing, s);
    }

    @Transactional
    public StockView configureMinStock(String code, Long ingredientId, BigDecimal minStock) {
        Machine m = machineService.getByCode(code);
        Ingredient ing = getIngredient(ingredientId);
        MachineStock s = lockedOrCreate(m, ing);
        s.setMinStock(minStock);
        return toView(ing, s);
    }

    @Transactional(readOnly = true)
    public PageView<RestockView> restocks(String code, int page, int size) {
        Machine m = machineService.getByCode(code);
        var p = restockLogRepo.findByMachineIdOrderByRestockedAtDesc(
                m.getId(), PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100)));
        List<RestockView> content = p.getContent().stream()
                .map(l -> new RestockView(l.getId(), l.getIngredient().getName(), l.getIngredient().getUnit(),
                        l.getQuantity(), l.getUser() == null ? null : l.getUser().getUsername(),
                        l.getRestockedAt()))
                .toList();
        return new PageView<>(content, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    // ---------- privados ----------

    private Ingredient getIngredient(Long id) {
        return ingredientRepo.findById(id).orElseThrow(() -> new NotFoundException("Ingrediente " + id));
    }

    /** Bloquea la fila de stock; si todavía no existe para esa cafetera, la crea. */
    private MachineStock lockedOrCreate(Machine m, Ingredient ing) {
        return stockRepo.findForUpdate(m.getId(), List.of(ing.getId())).stream().findFirst()
                .orElseGet(() -> {
                    MachineStock n = new MachineStock();
                    n.setMachineId(m.getId());
                    n.setIngredientId(ing.getId());
                    return stockRepo.save(n);
                });
    }

    private StockView toView(Ingredient i, MachineStock s) {
        BigDecimal stock = s == null ? BigDecimal.ZERO : s.getStock();
        BigDecimal min = s == null ? BigDecimal.ZERO : s.getMinStock();
        return new StockView(i.getId(), i.getName(), i.getUnit(), stock, min, stock.compareTo(min) <= 0);
    }
}

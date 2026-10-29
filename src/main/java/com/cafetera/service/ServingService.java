package com.cafetera.service;

import com.cafetera.dto.DTOs.*;
import com.cafetera.exception.BusinessException;
import com.cafetera.exception.InsufficientStockException;
import com.cafetera.exception.NotFoundException;
import com.cafetera.exception.PriceChangedException;
import com.cafetera.model.*;
import com.cafetera.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServingService {

    private final MachineService machineService;
    private final CoffeeRepository coffeeRepo;
    private final IngredientRepository ingredientRepo;
    private final MachineStockRepository stockRepo;
    private final ServingRepository servingRepo;

    /** Resultado de resolver receta + validar ingredientes + calcular precio y faltantes. */
    private record Plan(Coffee coffee, boolean customized, CupSize size, List<RecipeLineDto> lines,
                        Map<Long, Ingredient> catalog, Map<Long, MachineStock> stock,
                        BigDecimal price, List<String> missing) {}
    /** Presupuesto: precio y disponibilidad de la receta (original o editada). No modifica nada. */
    @Transactional(readOnly = true)
    public QuoteResult quote(String machineCode, Long coffeeId, ServeRequest req) {
        Machine machine = machineService.getByCode(machineCode);
        Plan p = plan(machine, coffeeId, req, false);
        return new QuoteResult(p.price(), p.missing().isEmpty(), p.missing(), toLineViews(p), p.size());
    }

    /** Sirve el café: bloquea el stock, valida, descuenta y registra el servicio. */
    @Transactional
    public ServeResult serve(String machineCode, Long coffeeId, ServeRequest req) {
        Machine machine = machineService.getByCode(machineCode);
        Plan p = plan(machine, coffeeId, req, true);

        if (!p.missing().isEmpty()) throw new InsufficientStockException(p.missing());
        if (req != null && req.expectedPrice() != null && req.expectedPrice().compareTo(p.price()) != 0)
            throw new PriceChangedException(p.price());

        Serving serving = new Serving();
        serving.setMachine(machine);
        serving.setCoffeeId(p.coffee().getId());
        serving.setCoffeeName(p.coffee().getName());
        serving.setCustomized(p.customized());
        serving.setSize(p.size());
        serving.setPrice(p.price());
        serving.setServedAt(Instant.now());

        for (RecipeLineDto l : p.lines()) {
            Ingredient ing = p.catalog().get(l.ingredientId());
            MachineStock s = p.stock().get(l.ingredientId());
            s.setStock(s.getStock().subtract(l.quantity()));   // dirty checking lo persiste al terminar

            ServingItem item = new ServingItem();
            item.setServing(serving);
            item.setIngredientId(ing.getId());
            item.setIngredientName(ing.getName());
            item.setUnit(ing.getUnit());
            item.setQuantity(l.quantity());
            item.setUnitPrice(ing.getPrice());
            serving.getItems().add(item);
        }
        servingRepo.save(serving);

        List<StockAlert> alerts = p.stock().values().stream()
                .filter(MachineStock::isLow)
                .map(s -> {
                    Ingredient i = p.catalog().get(s.getIngredientId());
                    return new StockAlert(i.getId(), i.getName(), i.getUnit(),
                            s.getStock(), s.getMinStock(), s.isEmpty());
                }).toList();

        return new ServeResult(serving.getId(), machine.getCode(), serving.getCoffeeName(), serving.getSize(),
                serving.getPrice(), serving.isCustomized(), toLineViews(p), serving.getServedAt(), alerts);
    }

    @Transactional(readOnly = true)
    public PageView<ServingSummary> history(String machineCode, int page, int size) {
        Machine machine = machineService.getByCode(machineCode);
        var p = servingRepo.findByMachineIdOrderByServedAtDesc(
                machine.getId(), PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100)));
        List<ServingSummary> content = p.getContent().stream()
                .map(s -> new ServingSummary(s.getId(), s.getCoffeeName(), s.getSize(), s.getPrice(),
                        s.isCustomized(), s.getServedAt()))
                .toList();
        return new PageView<>(content, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    // ---------- lógica compartida por quote y serve ----------

    private Plan plan(Machine machine, Long coffeeId, ServeRequest req, boolean lock) {
        Coffee coffee = coffeeRepo.findById(coffeeId)
                .orElseThrow(() -> new NotFoundException("Café " + coffeeId));

        CupSize size = (req != null && req.size() != null) ? req.size() : CupSize.MEDIUM;
        boolean customized = req != null && req.recipe() != null;

        List<RecipeLineDto> base = customized
                ? req.recipe()
                : coffee.getRecipe().stream()
                .map(r -> new RecipeLineDto(r.getIngredient().getId(), r.getQuantity())).toList();

        Set<Long> ids = base.stream().map(RecipeLineDto::ingredientId).collect(Collectors.toSet());
        if (ids.size() != base.size()) throw new BusinessException("Ingrediente repetido en la receta");

// Las cantidades de la receta son para 250 ml: se escalan al tamaño pedido
        List<RecipeLineDto> lines = base.stream()
                .map(l -> new RecipeLineDto(l.ingredientId(), size.scale(l.quantity())))
                .toList();
        Map<Long, Ingredient> catalog = ingredientRepo.findAllById(ids).stream()
                .collect(Collectors.toMap(Ingredient::getId, i -> i));
        if (catalog.size() != ids.size()) throw new NotFoundException("Algún ingrediente");

        List<MachineStock> rows = lock
                ? stockRepo.findForUpdate(machine.getId(), ids)
                : stockRepo.findByMachineAndIngredients(machine.getId(), ids);
        Map<Long, MachineStock> stock = rows.stream()
                .collect(Collectors.toMap(MachineStock::getIngredientId, s -> s));

        List<String> missing = lines.stream()
                .filter(l -> !stock.containsKey(l.ingredientId())
                        || stock.get(l.ingredientId()).getStock().compareTo(l.quantity()) < 0)
                .map(l -> catalog.get(l.ingredientId()).getName())
                .toList();

        BigDecimal price = lines.stream()
                .map(l -> catalog.get(l.ingredientId()).getPrice().multiply(l.quantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return new Plan(coffee, customized, size, lines, catalog, stock, price, missing);
    }

    private List<RecipeLineView> toLineViews(Plan p) {
        return p.lines().stream().map(l -> {
            Ingredient i = p.catalog().get(l.ingredientId());
            return new RecipeLineView(i.getId(), i.getName(), i.getUnit(), l.quantity());
        }).toList();
    }
}

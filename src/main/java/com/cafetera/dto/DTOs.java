package com.cafetera.dto;

import com.cafetera.model.CupSize;
import com.cafetera.model.Role;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

/** Todos los DTO como records anidados en una sola clase contenedora. */
public final class DTOs {
    private DTOs() {}

    // ---------- Recetas y cafés ----------
    public record RecipeLineDto(@NotNull Long ingredientId, @NotNull @Positive BigDecimal quantity) {}

    public record RecipeLineView(Long ingredientId, String ingredientName, String unit, BigDecimal quantity) {}

    public record CoffeeRequest(@NotBlank @Size(max = 80) String name,
                                @NotEmpty List<@Valid RecipeLineDto> recipe) {}

    /** Café del catálogo global (sin disponibilidad: depende de la cafetera). */
    public record CoffeeView(Long id, String name, BigDecimal price, boolean predefined,
                             List<RecipeLineView> recipe) {}

    /** Café tal y como lo ve una cafetera concreta. */
    public record MachineCoffeeView(Long id, String name, BigDecimal price, boolean predefined,
                                    boolean available, List<RecipeLineView> recipe) {}

    // ---------- Ingredientes ----------
    public record IngredientRequest(@NotBlank @Size(max = 80) String name,
                                    @NotBlank @Size(max = 10) String unit,
                                    @NotNull @PositiveOrZero BigDecimal price) {}

    public record IngredientView(Long id, String name, String unit, BigDecimal price) {}

    // ---------- Cafeteras y stock ----------
    public record MachineRequest(@NotBlank @Size(max = 80) String name) {}

    public record MachineView(String code, String name, boolean active, Instant createdAt) {}

    public record StockView(Long ingredientId, String name, String unit,
                            BigDecimal stock, BigDecimal minStock, boolean low) {}

    public record RestockRequest(@NotNull @Positive BigDecimal quantity) {}

    public record StockConfigRequest(@NotNull @PositiveOrZero BigDecimal minStock) {}

    public record StockAlert(Long ingredientId, String name, String unit,
                             BigDecimal stock, BigDecimal minStock, boolean empty) {}

    public record RestockView(Long id, String ingredientName, String unit, BigDecimal quantity,
                              String username, Instant restockedAt) {}

    // ---------- Servir ----------
    /** recipe == null → receta original. expectedPrice == null → no se comprueba el precio. */
    public record SizeView(CupSize code, int volumeMl, BigDecimal factor) {}

    public record ServeRequest(@Size(min = 1) List<@Valid RecipeLineDto> recipe,
                               @PositiveOrZero BigDecimal expectedPrice,
                               CupSize size) {}      // size == null → MEDIUM

    public record QuoteResult(BigDecimal price, boolean available, List<String> missing,
                              List<RecipeLineView> recipe, CupSize size) {}

    public record ServeResult(Long servingId, String machineCode, String coffeeName, CupSize size,
                              BigDecimal price, boolean customized, List<RecipeLineView> recipe,
                              Instant servedAt, List<StockAlert> alerts) {}

    public record ServingSummary(Long id, String coffeeName, CupSize size, BigDecimal price,
                                 boolean customized, Instant servedAt) {}

    public record PageView<T>(List<T> content, int page, int size, long totalElements, int totalPages) {}

    // ---------- Auth y usuarios ----------
    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

    public record LoginResponse(String token, String username, Role role, Instant expiresAt) {}

    /** En la creación la contraseña es obligatoria; en la edición, si viene vacía no se cambia. */
    public record UserRequest(@NotBlank @Size(min = 3, max = 50) String username,
                              @Size(max = 72) String password,
                              @NotNull Role role,
                              Set<String> machineCodes,
                              Boolean active) {}

    public record UserView(Long id, String username, Role role, boolean active, Set<String> machineCodes) {}

    // ---------- Estadísticas ----------
    public record CoffeeStat(String coffeeName, long servings, BigDecimal revenue) {}

    public record IngredientUsage(String name, String unit, BigDecimal totalQuantity) {}

    public record StatsView(java.time.LocalDate from, java.time.LocalDate to,
                            long servings, BigDecimal revenue, long customized,
                            List<CoffeeStat> topCoffees, List<IngredientUsage> ingredientUsage) {}

    public record MachineStat(String code, String name, long servings, BigDecimal revenue) {}
}

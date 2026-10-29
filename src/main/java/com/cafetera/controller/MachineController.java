package com.cafetera.controller;

import com.cafetera.dto.DTOs.*;
import com.cafetera.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/machines")
@RequiredArgsConstructor
public class MachineController {

    private final MachineService machineService;
    private final StockService stockService;
    private final ServingService servingService;
    private final StatsService statsService;

    // ---------- Administración (solo admin) ----------

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public MachineView create(@Valid @RequestBody MachineRequest req) {
        return machineService.create(req.name());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<MachineView> list() { return machineService.listAll(); }

    // ---------- Pantalla de la cafetera (público) ----------

    @GetMapping("/{code}")
    public MachineView get(@PathVariable String code) { return machineService.view(code); }

    @GetMapping("/{code}/coffees")
    public List<MachineCoffeeView> coffees(@PathVariable String code) { return stockService.coffees(code); }

    @GetMapping("/{code}/stock")
    public List<StockView> stock(@PathVariable String code) { return stockService.list(code); }

    @GetMapping("/{code}/stock/low")
    public List<StockView> lowStock(@PathVariable String code) { return stockService.low(code); }

    @PostMapping("/{code}/coffees/{coffeeId}/quote")
    public QuoteResult quote(@PathVariable String code, @PathVariable Long coffeeId,
                             @Valid @RequestBody(required = false) ServeRequest req) {
        return servingService.quote(code, coffeeId, req);
    }

    @PostMapping("/{code}/coffees/{coffeeId}/serve")
    public ServeResult serve(@PathVariable String code, @PathVariable Long coffeeId,
                             @Valid @RequestBody(required = false) ServeRequest req) {
        return servingService.serve(code, coffeeId, req);
    }

    // ---------- Gestión (admin u operador asignado a esa cafetera) ----------

    @PostMapping("/{code}/stock/{ingredientId}/restock")
    @PreAuthorize("@access.canManage(#code, authentication)")
    public StockView restock(@PathVariable String code, @PathVariable Long ingredientId,
                             @Valid @RequestBody RestockRequest req, Authentication auth) {
        return stockService.restock(code, ingredientId, req.quantity(), AccessService.userId(auth));
    }

    @PutMapping("/{code}/stock/{ingredientId}")
    @PreAuthorize("@access.canManage(#code, authentication)")
    public StockView configure(@PathVariable String code, @PathVariable Long ingredientId,
                               @Valid @RequestBody StockConfigRequest req) {
        return stockService.configureMinStock(code, ingredientId, req.minStock());
    }

    @GetMapping("/{code}/servings")
    @PreAuthorize("@access.canManage(#code, authentication)")
    public PageView<ServingSummary> servings(@PathVariable String code,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return servingService.history(code, page, size);
    }

    @GetMapping("/{code}/restocks")
    @PreAuthorize("@access.canManage(#code, authentication)")
    public PageView<RestockView> restocks(@PathVariable String code,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return stockService.restocks(code, page, size);
    }

    @GetMapping("/{code}/stats")
    @PreAuthorize("@access.canManage(#code, authentication)")
    public StatsView stats(@PathVariable String code,
                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return statsService.forMachine(code, from, to);
    }
}

package com.cafetera.controller;

import com.cafetera.dto.DTOs.CoffeeRequest;
import com.cafetera.dto.DTOs.CoffeeView;
import com.cafetera.service.CoffeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Catálogo global de cafés. Servir un café está en MachineController (depende de la cafetera). */
@RestController
@RequestMapping("/api/coffees")
@RequiredArgsConstructor
public class CoffeeController {

    private final CoffeeService service;

    @GetMapping
    public List<CoffeeView> list() { return service.findAll(); }

    @GetMapping("/{id}")
    public CoffeeView get(@PathVariable Long id) { return service.findById(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CoffeeView create(@Valid @RequestBody CoffeeRequest req) { return service.create(req); }

    @PutMapping("/{id}")
    public CoffeeView update(@PathVariable Long id, @Valid @RequestBody CoffeeRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}

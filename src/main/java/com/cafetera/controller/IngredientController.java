package com.cafetera.controller;

import com.cafetera.dto.DTOs.IngredientRequest;
import com.cafetera.dto.DTOs.IngredientView;
import com.cafetera.service.IngredientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingredients")
@RequiredArgsConstructor
public class IngredientController {

    private final IngredientService service;

    @GetMapping
    public List<IngredientView> list() { return service.findAll(); }

    @GetMapping("/{id}")
    public IngredientView get(@PathVariable Long id) { return service.findById(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IngredientView create(@Valid @RequestBody IngredientRequest req) { return service.create(req); }

    @PutMapping("/{id}")
    public IngredientView update(@PathVariable Long id, @Valid @RequestBody IngredientRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}

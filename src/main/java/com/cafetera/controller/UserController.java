package com.cafetera.controller;

import com.cafetera.dto.DTOs.UserRequest;
import com.cafetera.dto.DTOs.UserView;
import com.cafetera.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService service;

    @GetMapping
    public List<UserView> list() { return service.findAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserView create(@Valid @RequestBody UserRequest req) { return service.create(req); }

    @PutMapping("/{id}")
    public UserView update(@PathVariable Long id, @Valid @RequestBody UserRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id) { service.deactivate(id); }
}

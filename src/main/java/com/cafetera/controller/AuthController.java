package com.cafetera.controller;

import com.cafetera.dto.DTOs.LoginRequest;
import com.cafetera.dto.DTOs.LoginResponse;
import com.cafetera.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return service.login(req);
    }
}

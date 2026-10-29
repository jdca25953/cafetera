package com.cafetera.controller;

import com.cafetera.dto.DTOs.MachineView;
import com.cafetera.service.AccessService;
import com.cafetera.service.MachineService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final MachineService machineService;

    /** Cafeteras que el usuario autenticado puede gestionar (todas si es admin). */
    @GetMapping("/machines")
    public List<MachineView> myMachines(Authentication auth) {
        return machineService.forUser(AccessService.userId(auth), AccessService.isAdmin(auth));
    }
}

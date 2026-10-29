package com.cafetera.controller;

import com.cafetera.dto.DTOs.SizeView;
import com.cafetera.model.CupSize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/sizes")
public class SizeController {

    @GetMapping
    public List<SizeView> list() {
        return Arrays.stream(CupSize.values())
                .map(s -> new SizeView(s, s.getVolumeMl(), s.getFactor()))
                .toList();
    }
}
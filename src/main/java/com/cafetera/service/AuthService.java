package com.cafetera.service;

import com.cafetera.dto.DTOs.LoginRequest;
import com.cafetera.dto.DTOs.LoginResponse;
import com.cafetera.model.AppUser;
import com.cafetera.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final JwtEncoder jwt;

    @Value("${app.jwt-ttl-minutes}")
    private long ttlMinutes;

    public LoginResponse login(LoginRequest req) {
        AppUser u = users.findByUsername(req.username().trim())
                .filter(AppUser::isActive)
                .filter(x -> encoder.matches(req.password(), x.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Credenciales incorrectas")); // mismo mensaje en todos los fallos

        Instant now = Instant.now();
        Instant exp = now.plus(ttlMinutes, ChronoUnit.MINUTES);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(u.getUsername())
                .issuedAt(now)
                .expiresAt(exp)
                .claim("uid", u.getId())
                .claim("role", u.getRole().name())
                .build();
        String token = jwt.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new LoginResponse(token, u.getUsername(), u.getRole(), exp);
    }
}

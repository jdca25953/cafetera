package com.cafetera.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(c -> c.disable())                       // API sin estado, token en cabecera
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/login").permitAll()
                // Pantalla de la cafetera (pública)
                .requestMatchers(HttpMethod.GET,
                        "/api/machines/*", "/api/machines/*/coffees",
                        "/api/machines/*/stock", "/api/machines/*/stock/low").permitAll()
                .requestMatchers(HttpMethod.POST,
                        "/api/machines/*/coffees/*/quote", "/api/machines/*/coffees/*/serve").permitAll()
                // Catálogo: lectura pública y creación de cafés pública
                .requestMatchers(HttpMethod.GET, "/api/coffees/**", "/api/ingredients/**", "/api/sizes").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/coffees").permitAll()
                // Solo admin
                .requestMatchers("/api/users/**", "/api/stats/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/machines").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/machines").hasRole("ADMIN")
                .requestMatchers("/api/ingredients/**", "/api/coffees/**").hasRole("ADMIN")
                // Resto (restock, historial, stats de cafetera, /api/me): autenticado + @PreAuthorize por cafetera
                .anyRequest().authenticated())
            .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(jwtConverter())));
        return http.build();
    }

    private JwtAuthenticationConverter jwtConverter() {
        var authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("role");
        authorities.setAuthorityPrefix("ROLE_");
        var conv = new JwtAuthenticationConverter();
        conv.setJwtGrantedAuthoritiesConverter(authorities);
        return conv;
    }

    private static SecretKey key(String secret) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32)
            throw new IllegalStateException("app.jwt-secret (JWT_SECRET) debe tener al menos 32 caracteres");
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(@Value("${app.jwt-secret}") String secret) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key(secret)));
    }

    @Bean
    JwtDecoder jwtDecoder(@Value("${app.jwt-secret}") String secret) {
        return NimbusJwtDecoder.withSecretKey(key(secret)).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${app.cors-origin}") String origin) {
        var c = new CorsConfiguration();
        c.setAllowedOrigins(List.of(origin));
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        var src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/api/**", c);
        return src;
    }
}

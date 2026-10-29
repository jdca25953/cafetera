package com.cafetera.config;

import com.cafetera.model.AppUser;
import com.cafetera.model.Role;
import com.cafetera.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Crea el primer administrador al arrancar, si todavía no existe ninguno. */
@Configuration
public class AdminSeeder {

    @Bean
    CommandLineRunner seedAdmin(AppUserRepository users, PasswordEncoder encoder,
                                @Value("${app.admin.username}") String username,
                                @Value("${app.admin.password}") String password) {
        return args -> {
            if (users.existsByRole(Role.ADMIN)) return;
            AppUser a = new AppUser();
            a.setUsername(username);
            a.setPasswordHash(encoder.encode(password));
            a.setRole(Role.ADMIN);
            users.save(a);
        };
    }
}

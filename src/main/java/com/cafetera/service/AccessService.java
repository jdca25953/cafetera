package com.cafetera.service;

import com.cafetera.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Locale;

/** Se usa desde @PreAuthorize("@access.canManage(#code, authentication)"). */
@Component("access")
@RequiredArgsConstructor
public class AccessService {

    private final AppUserRepository users;

    public boolean canManage(String code, Authentication auth) {
        if (isAdmin(auth)) return true;
        Long uid = userId(auth);
        // consulta la BD: un operador desactivado o sin esa cafetera pierde el acceso al instante
        return uid != null && users.hasAccess(uid, code.trim().toUpperCase(Locale.ROOT));
    }

    public static boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    public static Long userId(Authentication auth) {
        if (auth.getPrincipal() instanceof Jwt jwt) {
            Object uid = jwt.getClaim("uid");
            return uid instanceof Number n ? n.longValue() : null;
        }
        return null;
    }
}
